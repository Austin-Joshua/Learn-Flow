import { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { dataCache } from '../utils/dataCache';
import {
  JourneyCourseItem,
  JourneyModuleItem,
  JourneyLessonItem,
} from '../types';

export interface Point {
  x: number;
  y: number;
}

export interface WaypointItem {
  module: JourneyModuleItem;
  point: Point;
  isCompleted: boolean;
  isCurrent: boolean;
  isLocked: boolean;
  lessons: Array<{ lesson: JourneyLessonItem; point: Point }>;
}

export interface TrailSegment {
  d: string;
  status: 'completed' | 'current' | 'locked';
  fromIndex: number;
}

export interface TrailGeometry {
  width: number;
  height: number;
  waypoints: WaypointItem[];
  segments: TrailSegment[];
  summitPoint: Point;
  mountainContours: string[];
}

export interface CourseStats {
  totalLessons: number;
  completedLessons: number;
  totalModules: number;
  completedModules: number;
}

export function useJourneyData() {
  const cachedJourney = dataCache.get<JourneyCourseItem[]>('learner_journey');
  const [courses, setCourses] = useState<JourneyCourseItem[]>(() => cachedJourney || []);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(() => cachedJourney?.[0]?.course_id || '');
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'trail' | 'ledger'>('trail');
  const [isLoading, setIsLoading] = useState<boolean>(!cachedJourney);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJourney = async () => {
      if (!dataCache.get('learner_journey')) {
        setIsLoading(true);
      }
      setError(null);
      try {
        const res = await api.learners.getJourney();
        const rawList = res.data.courses || [];
        const courseList: JourneyCourseItem[] = rawList.map((c) => ({
          ...c,
          title: c.title || c.course_title || c.slug || 'Course',
          modules: (c.modules || []).map((m) => ({
            ...m,
            id: m.id || m.module_id || '',
            lessons: (m.lessons || []).map((l) => ({
              ...l,
              id: l.id || l.lesson_id || '',
            })),
          })),
        }));
        setCourses(courseList);
        dataCache.set('learner_journey', courseList);
        if (courseList.length > 0) {
          setSelectedCourseId((prev) => (prev && courseList.some((x) => x.course_id === prev) ? prev : courseList[0].course_id));
        }
      } catch (err) {
        console.error('Failed to load learner journey', err);
        setError('Could not retrieve learning journey data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchJourney();
  }, []);

  const currentCourse = useMemo(() => {
    if (courses.length === 0) return null;
    return courses.find((c) => c.course_id === selectedCourseId) || courses[0];
  }, [courses, selectedCourseId]);

  // Compute total statistics
  const courseStats: CourseStats = useMemo(() => {
    if (!currentCourse) return { totalLessons: 0, completedLessons: 0, totalModules: 0, completedModules: 0 };
    const totalModules = currentCourse.modules.length;
    let completedModules = 0;
    let totalLessons = 0;
    let completedLessons = 0;

    for (const mod of currentCourse.modules) {
      const isModComplete = mod.lessons.length > 0 && mod.lessons.every((l) => l.status === 'completed');
      if (isModComplete) completedModules++;
      totalLessons += mod.total_lessons || mod.lessons.length;
      completedLessons += mod.completed_lessons || mod.lessons.filter((l) => l.status === 'completed').length;
    }

    return { totalLessons, completedLessons, totalModules, completedModules };
  }, [currentCourse]);

  // Mountain trail geometry computation
  const trailGeometry: TrailGeometry | null = useMemo(() => {
    if (!currentCourse || currentCourse.modules.length === 0) {
      return null;
    }

    const mods = currentCourse.modules;
    const numMods = mods.length;

    const width = 800;
    const rowStep = Math.max(130, Math.min(180, 720 / Math.max(1, numMods)));
    const topPadding = 120;
    const bottomPadding = 100;
    const height = topPadding + bottomPadding + numMods * rowStep;

    const waypoints: WaypointItem[] = [];
    const baseY = height - bottomPadding;

    mods.forEach((mod, index) => {
      const progressFromBottom = index / Math.max(1, numMods);
      const isEven = index % 2 === 0;
      const spread = 200 * (1 - progressFromBottom * 0.35);
      const x = isEven ? 400 - spread : 400 + spread;
      const y = baseY - index * rowStep;

      const isCompleted = mod.lessons.length > 0 && mod.lessons.every((l) => l.status === 'completed');
      const isLocked = mod.is_locked;
      const isCurrent = !isLocked && !isCompleted;

      const lessonPoints: Array<{ lesson: JourneyLessonItem; point: Point }> = [];
      const numLessons = mod.lessons.length;

      mod.lessons.forEach((les, lesIdx) => {
        const fraction = (lesIdx + 1) / (numLessons + 1);
        const nextX = index < numMods - 1 ? (isEven ? 400 + spread : 400 - spread) : 400;
        const lx = x + (nextX - x) * fraction * 0.45;
        const ly = y - rowStep * fraction * 0.4;
        lessonPoints.push({ lesson: les, point: { x: lx, y: ly } });
      });

      waypoints.push({
        module: mod,
        point: { x, y },
        isCompleted,
        isCurrent,
        isLocked,
        lessons: lessonPoints,
      });
    });

    const summitPoint: Point = { x: 400, y: topPadding - 40 };

    const segments: TrailSegment[] = [];
    for (let i = 0; i < waypoints.length; i++) {
      const currentPt = waypoints[i].point;
      const nextPt = i < waypoints.length - 1 ? waypoints[i + 1].point : summitPoint;

      const dy = nextPt.y - currentPt.y;
      const cp1: Point = { x: currentPt.x, y: currentPt.y + dy * 0.45 };
      const cp2: Point = { x: nextPt.x, y: currentPt.y + dy * 0.55 };

      const d = `M ${currentPt.x} ${currentPt.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${nextPt.x} ${nextPt.y}`;
      const status: 'completed' | 'current' | 'locked' =
        waypoints[i].isCompleted ? 'completed' : waypoints[i].isLocked ? 'locked' : 'current';

      segments.push({ d, status, fromIndex: i });
    }

    const mountainContours = [
      `M 80 ${height} L 400 ${topPadding - 60} L 720 ${height} Z`,
      `M 160 ${height} L 400 ${topPadding - 20} L 640 ${height}`,
      `M 240 ${height} L 360 ${topPadding + 140} L 560 ${height}`,
      `M 400 ${topPadding - 60} L 400 ${height}`,
    ];

    return {
      width,
      height,
      waypoints,
      segments,
      summitPoint,
      mountainContours,
    };
  }, [currentCourse]);

  const activeModule = useMemo(() => {
    if (!currentCourse || !selectedModuleId) return null;
    return currentCourse.modules.find((m) => m.id === selectedModuleId) || null;
  }, [currentCourse, selectedModuleId]);

  return {
    courses,
    selectedCourseId,
    setSelectedCourseId,
    selectedModuleId,
    setSelectedModuleId,
    activeTab,
    setActiveTab,
    isLoading,
    error,
    currentCourse,
    courseStats,
    trailGeometry,
    activeModule,
  };
}
