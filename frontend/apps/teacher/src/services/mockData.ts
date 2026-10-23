import {
  User,
  Group,
  Student,
  Lesson,
  AttendanceRecord,
  Homework,
  HomeworkSubmission,
  Notification,
  Announcement,
  TeacherSalaryRecord,
} from '../types';

export const INITIAL_TEACHER: User = {
  id: 'tch-001',
  username: 'teacher_aziz',
  full_name: 'Azizbek Rahimov',
  email: 'azizbek.rahimov@avlodtalim.uz',
  role: 'teacher',
  phone: '+998 90 123 45 67',
  avatar_url: '/src/assets/images/avatar_teacher_aziz_1792145043285.jpg',
  subjects: ['Python Backend Development', 'Django Framework', 'PostgreSQL & Database Design'],
  department: 'Dasturlash va Axborot Texnologiyalari',
  status: 'active',
};

export const INITIAL_GROUPS: Group[] = [
  {
    id: 'grp-py-101',
    name: 'Python-PRO-24',
    course_name: 'Python Backend Development',
    level: 'Advanced',
    student_count: 14,
    days: ['Dushanba', 'Chorshanba', 'Juma'],
    start_time: '14:00',
    end_time: '16:00',
    room: 'Lab 204 (Silicon Valley)',
    status: 'active',
    start_date: '2026-08-01',
    end_date: '2026-12-25',
  },
  {
    id: 'grp-dj-102',
    name: 'Django-REST-12',
    course_name: 'Django & API Architecture',
    level: 'Intermediate',
    student_count: 12,
    days: ['Seshanba', 'Payshanba', 'Shanba'],
    start_time: '16:30',
    end_time: '18:30',
    room: 'Lab 301 (Turing Hall)',
    status: 'active',
    start_date: '2026-09-01',
    end_date: '2027-01-20',
  },
  {
    id: 'grp-fnd-103',
    name: 'IT-Foundation-08',
    course_name: 'Algorithms & Database Basics',
    level: 'Beginner',
    student_count: 16,
    days: ['Dushanba', 'Chorshanba', 'Juma'],
    start_time: '10:00',
    end_time: '12:00',
    room: 'Auditorium 102',
    status: 'active',
    start_date: '2026-09-15',
    end_date: '2027-02-15',
  },
  {
    id: 'grp-sql-104',
    name: 'PostgreSQL-Master-03',
    course_name: 'Advanced PostgreSQL',
    level: 'Advanced',
    student_count: 10,
    days: ['Shanba', 'Yakshanba'],
    start_time: '10:00',
    end_time: '13:00',
    room: 'Lab 204 (Silicon Valley)',
    status: 'active',
    start_date: '2026-10-01',
    end_date: '2026-11-30',
  },
];

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'std-001',
    student_code: 'AVL-2026-0101',
    full_name: 'Javohir Toshmatov',
    group_id: 'grp-py-101',
    group_name: 'Python-PRO-24',
    course_name: 'Python Backend Development',
    phone: '+998 93 501 23 45',
    parent_phone: '+998 90 911 00 11',
    enrollment_status: 'active',
    attendance_rate: 96.2,
    total_lessons: 26,
    attended_lessons: 25,
    missed_lessons: 0,
    late_lessons: 1,
    coins_balance: 85,
  },
  {
    id: 'std-002',
    student_code: 'AVL-2026-0102',
    full_name: 'Madina Karimova',
    group_id: 'grp-py-101',
    group_name: 'Python-PRO-24',
    course_name: 'Python Backend Development',
    phone: '+998 94 620 44 88',
    enrollment_status: 'active',
    attendance_rate: 100,
    total_lessons: 26,
    attended_lessons: 26,
    missed_lessons: 0,
    late_lessons: 0,
    coins_balance: 120,
  },
  {
    id: 'std-003',
    student_code: 'AVL-2026-0103',
    full_name: 'Sardorbek Alimov',
    group_id: 'grp-py-101',
    group_name: 'Python-PRO-24',
    course_name: 'Python Backend Development',
    phone: '+998 91 123 99 77',
    enrollment_status: 'active',
    attendance_rate: 88.5,
    total_lessons: 26,
    attended_lessons: 23,
    missed_lessons: 2,
    late_lessons: 1,
    coins_balance: 45,
  },
  {
    id: 'std-004',
    student_code: 'AVL-2026-0104',
    full_name: 'Dilnoza Yusupova',
    group_id: 'grp-py-101',
    group_name: 'Python-PRO-24',
    course_name: 'Python Backend Development',
    phone: '+998 97 733 12 12',
    enrollment_status: 'active',
    attendance_rate: 92.3,
    total_lessons: 26,
    attended_lessons: 24,
    missed_lessons: 1,
    late_lessons: 1,
    coins_balance: 90,
  },
  {
    id: 'std-005',
    student_code: 'AVL-2026-0105',
    full_name: 'Bobur Mirzayev',
    group_id: 'grp-py-101',
    group_name: 'Python-PRO-24',
    course_name: 'Python Backend Development',
    phone: '+998 99 800 55 66',
    enrollment_status: 'active',
    attendance_rate: 96.2,
    total_lessons: 26,
    attended_lessons: 25,
    missed_lessons: 1,
    late_lessons: 0,
    coins_balance: 70,
  },
  {
    id: 'std-006',
    student_code: 'AVL-2026-0201',
    full_name: 'Shaxzod Nurmatov',
    group_id: 'grp-dj-102',
    group_name: 'Django-REST-12',
    course_name: 'Django & API Architecture',
    phone: '+998 90 888 12 34',
    enrollment_status: 'active',
    attendance_rate: 91.7,
    total_lessons: 18,
    attended_lessons: 16,
    missed_lessons: 1,
    late_lessons: 1,
    coins_balance: 60,
  },
  {
    id: 'std-007',
    student_code: 'AVL-2026-0202',
    full_name: 'Nigora Ergashova',
    group_id: 'grp-dj-102',
    group_name: 'Django-REST-12',
    course_name: 'Django & API Architecture',
    phone: '+998 93 444 77 99',
    enrollment_status: 'active',
    attendance_rate: 100,
    total_lessons: 18,
    attended_lessons: 18,
    missed_lessons: 0,
    late_lessons: 0,
    coins_balance: 110,
  },
  {
    id: 'std-008',
    student_code: 'AVL-2026-0203',
    full_name: 'Akmal Zokirov',
    group_id: 'grp-dj-102',
    group_name: 'Django-REST-12',
    course_name: 'Django & API Architecture',
    phone: '+998 91 999 00 22',
    enrollment_status: 'active',
    attendance_rate: 83.3,
    total_lessons: 18,
    attended_lessons: 15,
    missed_lessons: 2,
    late_lessons: 1,
    coins_balance: 40,
  },
  {
    id: 'std-009',
    student_code: 'AVL-2026-0301',
    full_name: 'Jasur Saidov',
    group_id: 'grp-fnd-103',
    group_name: 'IT-Foundation-08',
    course_name: 'Algorithms & Database Basics',
    phone: '+998 94 111 22 33',
    enrollment_status: 'active',
    attendance_rate: 93.8,
    total_lessons: 16,
    attended_lessons: 15,
    missed_lessons: 1,
    late_lessons: 0,
    coins_balance: 95,
  },
  {
    id: 'std-010',
    student_code: 'AVL-2026-0302',
    full_name: 'Ziyoda Murodova',
    group_id: 'grp-fnd-103',
    group_name: 'IT-Foundation-08',
    course_name: 'Algorithms & Database Basics',
    phone: '+998 90 222 33 44',
    enrollment_status: 'active',
    attendance_rate: 100,
    total_lessons: 16,
    attended_lessons: 16,
    missed_lessons: 0,
    late_lessons: 0,
    coins_balance: 130,
  },
];

export const INITIAL_COIN_TRANSACTIONS: any[] = [
  {
    id: 'ctx-001',
    student_id: 'std-001',
    student_name: 'Javohir Toshmatov',
    student_code: 'AVL-2026-0101',
    teacher_id: 'tch-001',
    teacher_name: 'Azizbek Rahimov',
    group_id: 'grp-py-101',
    group_name: 'Python-PRO-24',
    lesson_id: 'lsn-105',
    amount: 15,
    transaction_type: 'reward',
    reason: 'Darsdagi faol ishtiroki uchun',
    comment: 'Singleton patterndagi double-checked locking konseptsiyasini tushuntirib berdi.',
    created_at: '2026-10-14 15:45',
  },
  {
    id: 'ctx-002',
    student_id: 'std-002',
    student_name: 'Madina Karimova',
    student_code: 'AVL-2026-0102',
    teacher_id: 'tch-001',
    teacher_name: 'Azizbek Rahimov',
    group_id: 'grp-py-101',
    group_name: 'Python-PRO-24',
    lesson_id: 'lsn-105',
    amount: 20,
    transaction_type: 'reward',
    reason: 'Uy vazifasini a’lo darajada bajargan',
    comment: 'Metaclass orqali Singleton yechimini eng toza va professional tarzda taqdim etdi.',
    created_at: '2026-10-14 15:50',
  },
  {
    id: 'ctx-003',
    student_id: 'std-004',
    student_name: 'Dilnoza Yusupova',
    student_code: 'AVL-2026-0104',
    teacher_id: 'tch-001',
    teacher_name: 'Azizbek Rahimov',
    group_id: 'grp-py-101',
    group_name: 'Python-PRO-24',
    lesson_id: 'lsn-105',
    amount: 10,
    transaction_type: 'reward',
    reason: 'Savolga to‘g‘ri va asosli javob uchun',
    comment: 'Multithreading deadlock xavflari haqidagi savolga to‘g‘ri javob berdi.',
    created_at: '2026-10-14 15:55',
  },
];

export const INITIAL_SHOP_ITEMS: any[] = [
  {
    id: 'shp-001',
    title: 'Avlod Ta’lim Brendli Xudi (Hoodie)',
    description: 'Yuqori sifatli qalin paxta matoli Avlod Ta’lim logotipi tushirilgan qulay kiyim.',
    cost_coins: 80,
    category: 'merch',
    stock: 12,
  },
  {
    id: 'shp-002',
    title: 'IT Stikerlar To‘plami (Developer Pack)',
    description: 'Python, Django, PostgreSQL va Avlod Ta’lim noutbuk stikerlari.',
    cost_coins: 15,
    category: 'merch',
    stock: 50,
  },
  {
    id: 'shp-003',
    title: '1-ga-1 Mentor Konsultatsiyasi (45 daqiqa)',
    description: 'Katta dasturchi (Senior Developer) bilan shaxsiy loyiha kodi tahlili va karyera bo‘yicha maslahat.',
    cost_coins: 50,
    category: 'study',
    stock: 8,
  },
  {
    id: 'shp-004',
    title: 'Avlod Ta’lim Termos Krujkasi',
    description: 'Issiq va sovuq haroratni 12 soatgacha saqlaydigan metall termos idish.',
    cost_coins: 40,
    category: 'merch',
    stock: 15,
  },
];

export const INITIAL_LESSONS: Lesson[] = [
  {
    id: 'lsn-101',
    group_id: 'grp-fnd-103',
    group_name: 'IT-Foundation-08',
    course_name: 'Algorithms & Database Basics',
    date: '2026-10-16', // Today
    start_time: '10:00',
    end_time: '12:00',
    room: 'Auditorium 102',
    status: 'completed',
    topic: 'Relational Database Normalization (1NF, 2NF, 3NF)',
    summary: 'Explained functional dependencies, anomalies in unnormalized tables, and decomposing tables into Boyce-Codd Normal Form.',
    covered_material: 'PostgreSQL schema definitions, foreign key constraints, composite primary keys.',
    homework_assigned: 'Design an e-commerce database schema satisfying 3NF with ER diagram.',
    additional_notes: 'All students grasped foreign key cascades well; Jasur asked questions on M:N relationships.',
    completed_at: '2026-10-16 12:05',
    completed_by: 'Azizbek Rahimov',
    attendance_submitted: true,
    video_status: 'approved',
    video_url: 'https://storage.avlodtalim.uz/lessons/lsn-101-normalization.mp4',
    video_feedback: 'Excellent presentation and classroom engagement.',
  },
  {
    id: 'lsn-102',
    group_id: 'grp-py-101',
    group_name: 'Python-PRO-24',
    course_name: 'Python Backend Development',
    date: '2026-10-16', // Today
    start_time: '14:00',
    end_time: '16:00',
    room: 'Lab 204 (Silicon Valley)',
    status: 'in_progress',
    topic: 'Asynchronous Programming in Python: asyncio, tasks & event loops',
    summary: '',
    covered_material: '',
    attendance_submitted: false,
    video_status: 'not_submitted',
  },
  {
    id: 'lsn-103',
    group_id: 'grp-dj-102',
    group_name: 'Django-REST-12',
    course_name: 'Django & API Architecture',
    date: '2026-10-17', // Tomorrow
    start_time: '16:30',
    end_time: '18:30',
    room: 'Lab 301 (Turing Hall)',
    status: 'planned',
    topic: 'JWT Authentication and Custom Permission Classes in DRF',
    attendance_submitted: false,
    video_status: 'not_submitted',
  },
  {
    id: 'lsn-104',
    group_id: 'grp-sql-104',
    group_name: 'PostgreSQL-Master-03',
    course_name: 'Advanced PostgreSQL',
    date: '2026-10-18', // Day after tomorrow
    start_time: '10:00',
    end_time: '13:00',
    room: 'Lab 204 (Silicon Valley)',
    status: 'planned',
    topic: 'Query Optimization, EXPLAIN ANALYZE, and B-Tree vs GIN Indexing',
    attendance_submitted: false,
    video_status: 'not_submitted',
  },
  {
    id: 'lsn-105',
    group_id: 'grp-py-101',
    group_name: 'Python-PRO-24',
    course_name: 'Python Backend Development',
    date: '2026-10-14', // Earlier this week
    start_time: '14:00',
    end_time: '16:00',
    room: 'Lab 204 (Silicon Valley)',
    status: 'completed',
    topic: 'Object-Oriented Design Patterns: Factory & Singleton in Python',
    summary: 'Covered creational patterns, metaclasses, and thread-safe implementations.',
    covered_material: 'Factory Method, Abstract Factory, __new__ method overriding.',
    homework_assigned: 'Implement a database connection pool singleton.',
    completed_at: '2026-10-14 16:10',
    completed_by: 'Azizbek Rahimov',
    attendance_submitted: true,
    video_status: 'approved',
    video_url: 'https://storage.avlodtalim.uz/lessons/lsn-105-oop-patterns.mp4',
    video_feedback: 'Approved by Educational Director Humoyun.',
  },
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [];

export const INITIAL_HOMEWORK: Homework[] = [
  {
    id: 'hw-001',
    group_id: 'grp-py-101',
    group_name: 'Python-PRO-24',
    course_name: 'Python Backend Development',
    title: 'Singleton DB Pool & Factory Implementation',
    description: 'Implement a thread-safe Singleton pattern for a PostgreSQL connection pool. Include unit tests using pytest verifying that multiple concurrent threads receive the identical instance.',
    deadline: '2026-10-18 23:59',
    attachments: [
      { name: 'db_pool_starter.py', url: '#', size: '14 KB' },
      { name: 'assignment_rubric.pdf', url: '#', size: '180 KB' },
    ],
    total_students: 14,
    submissions_count: 11,
    reviewed_count: 8,
    created_at: '2026-10-14 16:30',
  },
  {
    id: 'hw-002',
    group_id: 'grp-dj-102',
    group_name: 'Django-REST-12',
    course_name: 'Django & API Architecture',
    title: 'DRF Serializers & Custom Validations',
    description: 'Create serializers for Student and Course models with custom field validators preventing conflicting schedule overlaps.',
    deadline: '2026-10-20 20:00',
    attachments: [
      { name: 'models_guide.md', url: '#', size: '8 KB' },
    ],
    total_students: 12,
    submissions_count: 6,
    reviewed_count: 2,
    created_at: '2026-10-13 18:00',
  },
  {
    id: 'hw-003',
    group_id: 'grp-fnd-103',
    group_name: 'IT-Foundation-08',
    course_name: 'Algorithms & Database Basics',
    title: '3NF E-Commerce Schema Design',
    description: 'Design relational tables for Users, Orders, OrderItems, Products, and Categories. Draw an ER diagram and write DDL scripts.',
    deadline: '2026-10-19 18:00',
    attachments: [],
    total_students: 16,
    submissions_count: 14,
    reviewed_count: 14,
    created_at: '2026-10-16 12:15',
  },
];

export const INITIAL_SUBMISSIONS: HomeworkSubmission[] = [
  {
    id: 'sub-001',
    homework_id: 'hw-001',
    student_id: 'std-001',
    student_name: 'Javohir Toshmatov',
    student_code: 'AVL-2026-0101',
    submitted_at: '2026-10-15 19:40',
    file_name: 'singleton_db_pool.py',
    code_language: 'python',
    code_content: `import threading
import time

class SingletonDatabasePool:
    """Thread-safe Singleton implementation for Database Connection Pool"""
    _instance = None
    _lock = threading.Lock()

    def __new__(cls, max_connections: int = 10):
        if not cls._instance:
            with cls._lock:
                if not cls._instance:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialize_pool(max_connections)
        return cls._instance

    def _initialize_pool(self, max_connections: int):
        self.max_connections = max_connections
        self.active_connections = 0
        self.is_connected = True
        print(f"[Pool Initialized] Max connections: {max_connections}")

    def acquire_connection(self):
        with self._lock:
            if self.active_connections < self.max_connections:
                self.active_connections += 1
                return f"Connection-{self.active_connections} acquired"
            raise ConnectionError("Pool exhausted!")

    def release_connection(self):
        with self._lock:
            if self.active_connections > 0:
                self.active_connections -= 1`,
    comment: 'Singleton implementing double-checked locking with threading.Lock(). Tests pass 100%.',
    status: 'reviewed',
    score: 95,
    coins_awarded: 18,
    feedback: 'Ajoyib yechim! Thread-safety to‘g‘ri ta’minlangan, testlar to‘liq qamrab olgan.',
    reviewed_at: '2026-10-16 09:30',
  },
  {
    id: 'sub-002',
    homework_id: 'hw-001',
    student_id: 'std-002',
    student_name: 'Madina Karimova',
    student_code: 'AVL-2026-0102',
    submitted_at: '2026-10-15 22:15',
    file_name: 'metaclass_pool.py',
    code_language: 'python',
    code_content: `class SingletonMeta(type):
    """Thread-safe Singleton Metaclass"""
    _instances = {}
    _lock = threading.Lock()

    def __call__(cls, *args, **kwargs):
        with cls._lock:
            if cls not in cls._instances:
                instance = super().__call__(*args, **kwargs)
                cls._instances[cls] = instance
        return cls._instances[cls]

class DatabaseService(metaclass=SingletonMeta):
    def __init__(self, host="localhost", port=5432):
        self.host = host
        self.port = port
        self.connected_at = time.time()

    def query(self, sql: str):
        return f"Executing '{sql}' on {self.host}:{self.port}"`,
    comment: 'Metaclass yordamida Singleton yaratdim. Kod PEP8 standartiga to‘liq mos.',
    status: 'reviewed',
    score: 98,
    coins_awarded: 20,
    feedback: 'Metaclass orqali amalga oshirilgani juda toza va professional.',
    reviewed_at: '2026-10-16 09:45',
  },
  {
    id: 'sub-003',
    homework_id: 'hw-001',
    student_id: 'std-003',
    student_name: 'Sardorbek Alimov',
    student_code: 'AVL-2026-0103',
    submitted_at: '2026-10-16 01:10',
    file_name: 'sardor_hw.py',
    code_language: 'python',
    code_content: `import threading

class DatabasePool:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
        return cls._instance

    def get_connection(self):
        return "Connected to PostgreSQL on port 5432"

# Test instance creation
p1 = DatabasePool()
p2 = DatabasePool()
assert p1 is p2, "Instances must be identical!"
print("Test passed successfully!")`,
    comment: 'Ustoz, lock qo‘shishda biroz tushunmovchilik bo‘ldi, ko‘rib bersangiz xursand bo‘lardim.',
    status: 'submitted',
  },
  {
    id: 'sub-004',
    homework_id: 'hw-001',
    student_id: 'std-004',
    student_name: 'Dilnoza Yusupova',
    student_code: 'AVL-2026-0104',
    submitted_at: '2026-10-16 02:20',
    file_name: 'factory_solution.py',
    code_language: 'python',
    code_content: `from abc import ABC, abstractmethod

class DatabaseConnector(ABC):
    @abstractmethod
    def connect(self):
        pass

class PostgresConnector(DatabaseConnector):
    def connect(self):
        return "Connected to PostgreSQL engine"

class MySQLConnector(DatabaseConnector):
    def connect(self):
        return "Connected to MySQL engine"

class ConnectorFactory:
    @staticmethod
    def create(db_type: str) -> DatabaseConnector:
        if db_type == "postgres":
            return PostgresConnector()
        elif db_type == "mysql":
            return MySQLConnector()
        raise ValueError(f"Unsupported db: {db_type}")`,
    comment: 'Factory va Singleton birlashtirilgan yechim.',
    status: 'submitted',
  },
];

export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-001',
    title: 'Dars jadvali tasdiqlandi',
    message: 'Bugungi "Python-PRO-24" guruhi darsi soat 14:00 da Lab 204 xonasida boshlanadi.',
    type: 'lesson',
    read: false,
    created_at: 'Bugun, 08:30',
    link_url: '/schedule',
  },
  {
    id: 'notif-002',
    title: 'Video dars tekshiruvi tasdiqlandi',
    message: '"IT-Foundation-08" guruhining dars video yozuvi O\'quv bo\'limi tomonidan qabul qilindi va tasdiqlandi.',
    type: 'video',
    read: false,
    created_at: 'Bugun, 12:30',
    link_url: '/video-submissions',
  },
  {
    id: 'notif-003',
    title: 'Yangi uy vazifasi topshirildi',
    message: 'Sardorbek Alimov "Singleton DB Pool" vazifasini topshirdi. Tekshirish kutilmoqda.',
    type: 'homework',
    read: false,
    created_at: 'Bugun, 01:10',
    link_url: '/homework',
  },
  {
    id: 'notif-004',
    title: 'Ma\'muriyat e\'loni',
    message: 'Direktor Humoyun tomonidan barcha o\'qituvchilar uchun haftalik metodik yig\'ilish e\'lon qilindi.',
    type: 'announcement',
    read: true,
    created_at: 'Kecha, 16:45',
    link_url: '/announcements',
  },
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'anc-001',
    title: 'Oktabr oyi o\'quv metodikasi va dars sifat nazorati yig\'ilishi',
    message: 'Hurmatli ustozlar! 19-oktabr, dushanba kuni soat 10:00 da O\'quv bo\'limi va Direktsiya ishtirokida yangi semestr dasturlari hamda talabalar davomatini monitoring qilish bo\'yicha oylik yig\'ilish o\'tkaziladi. Barcha ustozlar dars rejalari va video hisobotlari bilan qatnashishi so\'raladi.',
    author_name: 'Humoyun (O\'quv Markaz Direktori)',
    author_role: 'Bosh Direktor',
    priority: 'urgent',
    published_at: '2026-10-15',
    target_audience: 'Barcha o\'qituvchilar',
  },
  {
    id: 'anc-002',
    title: 'Avlod Ta\'lim yangi server laboratoriyalari ishga tushirildi',
    message: 'Dasturlash yo\'nalishidagi barcha guruhlar uchun Lab 204 va Lab 301 xonalaridagi kompyuterlar to\'liq yangilandi. PostgreSQL va Docker muhitlari barcha ishchi stansiyalarga sozlandi.',
    author_name: 'IT Administrator',
    author_role: 'Tizim Administratori',
    priority: 'important',
    published_at: '2026-10-12',
    target_audience: 'Dasturlash o\'qituvchilari',
  },
  {
    id: 'anc-003',
    title: 'Davomatni kiritish qat\'iy reglamenti',
    message: 'Har bir o\'qituvchi dars boshlanganidan so\'ng 15 daqiqa ichida o\'quvchilar davomatini Teacher Panel orqali kiritishi shart. Ota-onalar tizimida real vaqt rejimida SMS xabarnomalar yuborilmoqda.',
    author_name: 'O\'quv Bo\'limi',
    author_role: 'Admin',
    priority: 'normal',
    published_at: '2026-10-05',
    target_audience: 'Barcha xodimlar',
  },
];

export const INITIAL_SALARY_RECORDS: TeacherSalaryRecord[] = [
  {
    id: 'sal-2026-09',
    month: '2026-09',
    month_name: 'Sentabr 2026',
    base_rate_per_lesson: 180000,
    lessons_conducted: 36,
    bonus_amount: 500000,
    deductions: 0,
    approved_amount: 6980000,
    currency: 'UZS',
    status: 'paid',
    payment_date: '2026-10-05',
    payment_method: 'Bank hisob raqamiga (Humo/Uzcard)',
    note: 'Direktsiya tomonidan 100% tasdiqlangan va to\'langan.',
  },
  {
    id: 'sal-2026-08',
    month: '2026-08',
    month_name: 'Avgust 2026',
    base_rate_per_lesson: 180000,
    lessons_conducted: 32,
    bonus_amount: 400000,
    deductions: 0,
    approved_amount: 6160000,
    currency: 'UZS',
    status: 'paid',
    payment_date: '2026-09-05',
    payment_method: 'Bank hisob raqamiga',
    note: 'Yozgi intensiv guruhlar uchun maxsus ustama qo\'shilgan.',
  },
  {
    id: 'sal-2026-10',
    month: '2026-10',
    month_name: 'Oktabr 2026 (Joriy oy)',
    base_rate_per_lesson: 180000,
    lessons_conducted: 19, // so far
    bonus_amount: 250000,
    deductions: 0,
    approved_amount: 3670000,
    currency: 'UZS',
    status: 'pending',
    note: 'Oy davom etmoqda. Hisob-kitob 31-oktabrda yakuniy holatda yopiladi.',
  },
];
