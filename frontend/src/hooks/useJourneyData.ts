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

export interface CheckpointReward {
  id: string;
  name: string;
  elevation: number;
  biome: string;
  requiredProgress: number;
  rewardXp: number;
  rewardBadge: string;
  skills: string[];
  description: string;
}

export interface WaypointItem {
  id: string;
  module: JourneyModuleItem;
  point: Point;
  isCompleted: boolean;
  isCurrent: boolean;
  isLocked: boolean;
  lessons: Array<{ lesson: JourneyLessonItem; point: Point }>;
  checkpoint: CheckpointReward;
  index: number;
}

export interface TrailSegment {
  d: string;
  status: 'completed' | 'current' | 'locked';
  fromIndex: number;
  cp1: Point;
  cp2: Point;
  fromPoint: Point;
  toPoint: Point;
}

export interface TrailGeometry {
  width: number;
  height: number;
  waypoints: WaypointItem[];
  segments: TrailSegment[];
  summitPoint: Point;
  mountainContours: string[];
  travelerPoint: Point;
  currentElevation: number;
  currentCheckpointIndex: number;
  trailDistanceKm: number;
  totalKnowledgeXp: number;
  earnedKnowledgeXp: number;
  progressPercentage: number;
}

export interface CourseStats {
  totalLessons: number;
  completedLessons: number;
  totalModules: number;
  completedModules: number;
}

// Fallback baseline schema for tests and initial state
export const ALPINE_CHECKPOINTS: CheckpointReward[] = [
  {
    id: 'cp-1',
    name: 'Valley Basecamp & Trailhead',
    elevation: 600,
    biome: 'Lush Foothills Meadow',
    requiredProgress: 0,
    rewardXp: 100,
    rewardBadge: 'Trailblazer Compass',
    skills: ['Environment Setup', 'Curriculum Architecture', 'Course Blueprint'],
    description: 'The starting point of the academic expedition. Hikers prepare their gear, establish baseline knowledge, and orient toward the mountain summit.',
  },
  {
    id: 'cp-2',
    name: 'Pine Hollow Shelter',
    elevation: 1300,
    biome: 'Evergreen Conifer Forest',
    requiredProgress: 15,
    rewardXp: 150,
    rewardBadge: 'Foundations Badge',
    skills: ['Syntax Mastery', 'Core Primitives', 'Memory Models'],
    description: 'Sheltered among dense evergreen pines, learners master fundamentals and establish rock-solid conceptual foundations.',
  },
  {
    id: 'cp-3',
    name: 'Cascading Falls Overlook',
    elevation: 2050,
    biome: 'Alpine Stream & Gorge',
    requiredProgress: 30,
    rewardXp: 200,
    rewardBadge: 'System Architect Crest',
    skills: ['Data Flow', 'State Hydration', 'Component Hierarchies'],
    description: 'Crossing the high suspension bridge above the falls, hikers synthesize intermediate architecture and design patterns.',
  },
  {
    id: 'cp-4',
    name: 'Timberline Vista Pass',
    elevation: 2800,
    biome: 'Sub-Alpine Ridge',
    requiredProgress: 50,
    rewardXp: 250,
    rewardBadge: 'Endurance Flask',
    skills: ['Concurrency Primitives', 'Async Workflows', 'Error Resilience'],
    description: 'At the timberline where the trees give way to rocky slopes, learners tackle real-world hands-on laboratory exercises.',
  },
  {
    id: 'cp-5',
    name: 'Granite Switchback Cairn',
    elevation: 3550,
    biome: 'High Sierra Boulder Field',
    requiredProgress: 70,
    rewardXp: 300,
    rewardBadge: 'Glacier Pick of Insight',
    skills: ['B-Tree Indexing', 'WAL Replay', 'Row-Level Isolation'],
    description: 'Navigating steep granite switchbacks, conquering complex database internals, locking mechanisms, and crash recovery.',
  },
  {
    id: 'cp-6',
    name: 'Glacier Basin Outpost',
    elevation: 4300,
    biome: 'Glacial Scree & Snowfields',
    requiredProgress: 85,
    rewardXp: 400,
    rewardBadge: 'Eagle Feather of Wisdom',
    skills: ['Distributed Consensus', 'Raft Leader Quorum', 'Idempotent RPCs'],
    description: 'High above the clouds in the thin alpine air, solving distributed consensus challenges and mission-critical fault tolerance.',
  },
  {
    id: 'cp-7',
    name: 'Pinnacle Arête Plateau',
    elevation: 4850,
    biome: 'Summit Ridge Exposure',
    requiredProgress: 95,
    rewardXp: 500,
    rewardBadge: 'Summit Beacon Lantern',
    skills: ['Capstone Synthesis', 'Security Hardening', 'Audit Readiness'],
    description: 'The final exposed arête leading to the peak. Demonstrating end-to-end mastery before claiming the summit diploma.',
  },
];

export function useJourneyData() {
  const cachedJourney = dataCache.get<JourneyCourseItem[]>('learner_journey');
  const [courses, setCourses] = useState<JourneyCourseItem[]>(() => cachedJourney || []);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('learnflow_active_journey_course');
      if (saved) return saved;
    }
    return cachedJourney?.[0]?.course_id || '';
  });
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'trail' | 'ledger'>('trail');
  const [isLoading, setIsLoading] = useState<boolean>(!cachedJourney);
  const [error, setError] = useState<string | null>(null);

  const handleSelectCourseId = (id: string) => {
    setSelectedCourseId(id);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('learnflow_active_journey_course', id);
      } catch {
        // ignore
      }
    }
  };

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
          setSelectedCourseId((prev) => {
            const saved = typeof window !== 'undefined' ? localStorage.getItem('learnflow_active_journey_course') : null;
            if (saved && courseList.some((x) => x.course_id === saved)) {
              return saved;
            }
            if (prev && courseList.some((x) => x.course_id === prev)) {
              return prev;
            }
            return courseList[0].course_id;
          });
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

  // Mountain trail geometry computation matching actual course modules and ledger
  const trailGeometry: TrailGeometry | null = useMemo(() => {
    if (!currentCourse) {
      return null;
    }

    const width = 1000;
    const height = 850;
    const prog = Math.min(100, Math.max(0, currentCourse.progress_percentage || 0));

    // Get actual course modules from currentCourse
    const realModules = currentCourse.modules;
    const hasModules = realModules && realModules.length > 0;

    // Determine number of stations (at least 5, up to 7, or matching module count)
    const numStations = Math.max(5, Math.min(7, hasModules ? realModules.length : 5));

    // Calculate symmetrical, wide-span coordinates along the mountain switchback path
    const checkpointPoints: Point[] = [];
    for (let i = 0; i < numStations; i++) {
      const fraction = i / Math.max(1, numStations - 1);
      const isEven = i % 2 === 0;
      const spread = 240 * (1 - fraction * 0.32);
      const x = Math.round(isEven ? 500 - spread : 500 + spread);
      const y = Math.round(740 - fraction * (740 - 200));
      checkpointPoints.push({ x, y });
    }

    const summitPoint: Point = { x: 500, y: 90 }; // Summit Peak: Elev. 5,200m

    // Alpine biomes mapped by elevation
    const biomes = [
      'Valley Foothills & Trailhead',
      'Pine Forest Shelter',
      'Cascading Creek Gorge',
      'Sub-Alpine Timberline Vista',
      'High Sierra Granite Switchbacks',
      'Glacier Basin Snowfields',
      'Pinnacle Arête Plateau',
    ];

    // Build checkpoints dynamically from ACTUAL course modules so Trail & Ledger match 100%
    const waypoints: WaypointItem[] = checkpointPoints.map((pt, idx) => {
      let mod: JourneyModuleItem;

      if (hasModules) {
        // Map station to actual course module
        const modIdx = Math.min(realModules.length - 1, Math.floor((idx / numStations) * realModules.length));
        mod = realModules[modIdx];
      } else {
        mod = {
          id: `mod-${idx + 1}`,
          title: `Module ${idx + 1}: ${currentCourse.title || 'Course Foundations'}`,
          order_index: idx,
          is_locked: idx > 0,
          completed_lessons: idx === 0 ? 1 : 0,
          total_lessons: 3,
          lessons: [],
        };
      }

      // Checkpoint status derived directly from actual module in ledger
      const isModCompleted = mod.lessons.length > 0 && mod.lessons.every((l) => l.status === 'completed');
      const isProgReached = prog >= Math.round((idx / numStations) * 100);
      const isCompleted = isModCompleted || (mod.completed_lessons >= mod.total_lessons && mod.total_lessons > 0) || isProgReached;
      const isLocked = mod.is_locked;
      const isCurrent = !isCompleted && !isLocked && (idx === 0 || waypoints?.[idx - 1]?.isCompleted || prog >= Math.round(((idx - 1) / numStations) * 100));

      // Skills derived directly from actual lessons in this module
      const skills = mod.lessons.length > 0
        ? mod.lessons.map((l) => l.title)
        : [mod.title, 'Foundational Concepts', 'System Architecture'];

      const elevation = Math.round(600 + (idx / Math.max(1, numStations - 1)) * (4900 - 600));
      const biome = biomes[idx % biomes.length];
      const xpReward = 100 + idx * 50;

      const checkpoint: CheckpointReward = {
        id: `cp-${idx + 1}`,
        name: mod.title,
        elevation,
        biome,
        requiredProgress: Math.round((idx / numStations) * 100),
        rewardXp: xpReward,
        rewardBadge: `Station ${idx + 1} Mastery Crest`,
        skills,
        description: mod.assessment
          ? `${mod.title} • Includes ${mod.total_lessons} lessons and ${mod.assessment.title}.`
          : `${mod.title} • ${mod.total_lessons} structured lessons with verified concept checks.`,
      };

      const lessonPoints: Array<{ lesson: JourneyLessonItem; point: Point }> = [];
      const numLessons = mod.lessons.length;
      mod.lessons.forEach((les, lesIdx) => {
        const f = (lesIdx + 1) / (numLessons + 1);
        const nextPt = idx < numStations - 1 ? checkpointPoints[idx + 1] : summitPoint;
        const lx = pt.x + (nextPt.x - pt.x) * f * 0.4;
        const ly = pt.y + (nextPt.y - pt.y) * f * 0.4;
        lessonPoints.push({ lesson: les, point: { x: Math.round(lx), y: Math.round(ly) } });
      });

      return {
        id: checkpoint.id,
        module: mod,
        point: pt,
        isCompleted,
        isCurrent,
        isLocked,
        lessons: lessonPoints,
        checkpoint,
        index: idx,
      };
    });

    // Build curved switchback trail segments
    const allMilestonePoints: Point[] = [...checkpointPoints, summitPoint];
    const segments: TrailSegment[] = [];

    for (let i = 0; i < allMilestonePoints.length - 1; i++) {
      const fromPt = allMilestonePoints[i];
      const toPt = allMilestonePoints[i + 1];

      const dy = toPt.y - fromPt.y;
      const cp1: Point = { x: fromPt.x, y: fromPt.y + dy * 0.45 };
      const cp2: Point = { x: toPt.x, y: fromPt.y + dy * 0.55 };

      const d = `M ${fromPt.x} ${fromPt.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${toPt.x} ${toPt.y}`;
      const status: 'completed' | 'current' | 'locked' =
        waypoints[i]?.isCompleted ? 'completed' : waypoints[i]?.isLocked ? 'locked' : 'current';

      segments.push({ d, status, fromIndex: i, cp1, cp2, fromPoint: fromPt, toPoint: toPt });
    }

    // Calculate traveler's exact coordinates along the trail curve
    const t = prog / 100;
    let travelerPoint: Point;

    if (t <= 0) {
      travelerPoint = checkpointPoints[0];
    } else if (t >= 1) {
      travelerPoint = summitPoint;
    } else {
      const segmentFloat = t * (allMilestonePoints.length - 1);
      const segIdx = Math.min(allMilestonePoints.length - 2, Math.floor(segmentFloat));
      const localT = segmentFloat - segIdx;

      const seg = segments[segIdx];
      const p0 = seg.fromPoint;
      const p1 = seg.cp1;
      const p2 = seg.cp2;
      const p3 = seg.toPoint;

      // Cubic Bézier formula
      const omt = 1 - localT;
      const omt2 = omt * omt;
      const omt3 = omt2 * omt;
      const t2 = localT * localT;
      const t3 = t2 * localT;

      const bx = omt3 * p0.x + 3 * omt2 * localT * p1.x + 3 * omt * t2 * p2.x + t3 * p3.x;
      const by = omt3 * p0.y + 3 * omt2 * localT * p1.y + 3 * omt * t2 * p2.y + t3 * p3.y;

      travelerPoint = { x: Math.round(bx), y: Math.round(by) };
    }

    // Current elevation from 600m to 5,200m
    const currentElevation = Math.round(600 + (prog / 100) * (5200 - 600));

    // Active checkpoint index
    let currentCheckpointIndex = 0;
    for (let i = waypoints.length - 1; i >= 0; i--) {
      if (waypoints[i].isCompleted) {
        currentCheckpointIndex = Math.min(waypoints.length - 1, i + 1);
        break;
      }
    }

    // Knowledge XP calculations
    let earnedXp = 0;
    waypoints.forEach((wp) => {
      if (wp.isCompleted) earnedXp += wp.checkpoint.rewardXp;
    });
    if (prog === 100) earnedXp += 1000; // Summit Diploma bonus
    const totalKnowledgeXp = waypoints.reduce((acc, wp) => acc + wp.checkpoint.rewardXp, 0) + 1000;

    // Mountain contours spanning full width (0 to 1000)
    const mountainContours = [
      `M 0 ${height} L 500 80 L 1000 ${height} Z`,
      `M 100 ${height} L 500 120 L 900 ${height}`,
      `M 220 ${height} L 460 260 L 780 ${height}`,
      `M 500 80 L 500 ${height}`,
    ];

    return {
      width,
      height,
      waypoints,
      segments,
      summitPoint,
      mountainContours,
      travelerPoint,
      currentElevation,
      currentCheckpointIndex,
      trailDistanceKm: Math.round((prog / 100) * 14.8 * 10) / 10,
      totalKnowledgeXp,
      earnedKnowledgeXp: earnedXp,
      progressPercentage: prog,
    };
  }, [currentCourse]);

  const activeModule = useMemo(() => {
    if (!currentCourse || !selectedModuleId) return null;
    return currentCourse.modules.find((m) => m.id === selectedModuleId) || null;
  }, [currentCourse, selectedModuleId]);

  return {
    courses,
    selectedCourseId,
    setSelectedCourseId: handleSelectCourseId,
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
