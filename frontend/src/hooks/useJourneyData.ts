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

  // Mountain trail geometry computation with 7 checkpoints + Summit Peak
  const trailGeometry: TrailGeometry | null = useMemo(() => {
    if (!currentCourse) {
      return null;
    }

    const width = 800;
    const height = 1150;
    const prog = Math.min(100, Math.max(0, currentCourse.progress_percentage || 0));

    // Defined coordinates along the mountain switchback road
    const checkpointPoints: Point[] = [
      { x: 230, y: 1000 }, // Checkpoint 1: Basecamp
      { x: 570, y: 880 },  // Checkpoint 2: Pine Hollow
      { x: 250, y: 750 },  // Checkpoint 3: Cascading Falls
      { x: 550, y: 620 },  // Checkpoint 4: Timberline Vista
      { x: 270, y: 490 },  // Checkpoint 5: Granite Switchbacks
      { x: 530, y: 360 },  // Checkpoint 6: Glacier Basin
      { x: 330, y: 240 },  // Checkpoint 7: Pinnacle Arête
    ];

    const summitPoint: Point = { x: 400, y: 120 }; // Summit Peak: 5,200m

    // Map course modules and lessons to the 7 checkpoints
    const mods = currentCourse.modules.length > 0
      ? currentCourse.modules
      : [
          {
            id: 'mock-mod-1',
            title: currentCourse.title || 'Course Foundations',
            order_index: 0,
            is_locked: false,
            completed_lessons: 1,
            total_lessons: 4,
            lessons: [],
          },
        ];

    const waypoints: WaypointItem[] = ALPINE_CHECKPOINTS.map((cp, idx) => {
      const pt = checkpointPoints[idx];
      // Map to corresponding module in the course
      const modIdx = Math.min(mods.length - 1, Math.floor((idx / ALPINE_CHECKPOINTS.length) * mods.length));
      const mod = mods[modIdx];

      const isCompleted = prog >= cp.requiredProgress || (mod.completed_lessons >= mod.total_lessons && mod.total_lessons > 0);
      const isNextUncompleted = !isCompleted && (idx === 0 || prog >= ALPINE_CHECKPOINTS[idx - 1].requiredProgress);
      const isCurrent = isNextUncompleted || (idx === 0 && prog === 0);
      const isLocked = !isCompleted && !isCurrent;

      const lessonPoints: Array<{ lesson: JourneyLessonItem; point: Point }> = [];
      const numLessons = mod.lessons.length;
      mod.lessons.forEach((les, lesIdx) => {
        const fraction = (lesIdx + 1) / (numLessons + 1);
        const nextPt = idx < ALPINE_CHECKPOINTS.length - 1 ? checkpointPoints[idx + 1] : summitPoint;
        const lx = pt.x + (nextPt.x - pt.x) * fraction * 0.45;
        const ly = pt.y + (nextPt.y - pt.y) * fraction * 0.45;
        lessonPoints.push({ lesson: les, point: { x: lx, y: ly } });
      });

      return {
        id: cp.id,
        module: mod,
        point: pt,
        isCompleted,
        isCurrent,
        isLocked,
        lessons: lessonPoints,
        checkpoint: cp,
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
    // There are 7 trail segments between the 8 points
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
    const totalKnowledgeXp = 2900;

    // Mountain contours
    const mountainContours = [
      `M 50 ${height} L 400 80 L 750 ${height} Z`,
      `M 120 ${height} L 400 130 L 680 ${height}`,
      `M 200 ${height} L 360 270 L 600 ${height}`,
      `M 400 80 L 400 ${height}`,
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
