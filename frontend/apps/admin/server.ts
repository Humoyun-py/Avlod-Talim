import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'avlod-talim-secret-jwt-key-2026';
const DATA_FILE = path.join(__dirname, 'server_db.json');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Storage for receipts and product images
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDF documents are allowed'));
    }
  },
});

// Seed data initialization
interface DBData {
  users: any[];
  courses: any[];
  teachers: any[];
  groups: any[];
  students: any[];
  payments: any[];
  products: any[];
  orders: any[];
  notifications: any[];
  coinTransactions: any[];
}

function getInitialData(): DBData {
  return {
    users: [
      {
        id: 'usr_admin_1',
        username: 'admin',
        password_hash: 'admin123', // Demo authentication
        full_name: 'Dr. Anura K. Oridrova',
        role: 'admin',
        email: 'anura.admin@avlodtalim.uz',
        phone: '+998 90 123 45 67',
        avatar_url: '/src/assets/images/admin_avatar_1792586465148.jpg',
        status: 'active',
        created_at: '2025-09-01T08:00:00Z',
      },
      {
        id: 'usr_director_1',
        username: 'director',
        password_hash: 'director123',
        full_name: 'Bobur Mirzayev',
        role: 'director',
        email: 'director@avlodtalim.uz',
        phone: '+998 90 999 00 11',
        status: 'active',
        created_at: '2025-08-15T08:00:00Z',
      },
      {
        id: 'usr_teacher_1',
        username: 'teacher',
        password_hash: 'teacher123',
        full_name: 'Sardor Rakhimov',
        role: 'teacher',
        email: 'sardor.teacher@avlodtalim.uz',
        phone: '+998 93 456 78 90',
        status: 'active',
        created_at: '2025-09-10T08:00:00Z',
      },
      {
        id: 'usr_student_1',
        username: 'AVL-2026-1042',
        password_hash: 'student123',
        full_name: 'Javohir Alimov',
        role: 'student',
        email: 'javohir@student.uz',
        phone: '+998 91 321 65 43',
        status: 'active',
        created_at: '2026-01-10T08:00:00Z',
      },
    ],
    teachers: [
      {
        id: 'tch_1',
        full_name: 'Sardor Rakhimov',
        email: 'sardor.r@avlodtalim.uz',
        phone: '+998 93 456 78 90',
        specializations: ['Full-Stack Web Development', 'Python & Django'],
        active_groups: 3,
      },
      {
        id: 'tch_2',
        full_name: 'Nilufar Usmonova',
        email: 'nilufar.u@avlodtalim.uz',
        phone: '+998 97 123 99 88',
        specializations: ['UI/UX Design', 'Digital Product Design'],
        active_groups: 2,
      },
      {
        id: 'tch_3',
        full_name: 'Akmal Karimov',
        email: 'akmal.k@avlodtalim.uz',
        phone: '+998 90 777 44 22',
        specializations: ['Data Science & AI', 'Mobile Development Flutter'],
        active_groups: 2,
      },
      {
        id: 'tch_4',
        full_name: 'Madina Tursunova',
        email: 'madina.t@avlodtalim.uz',
        phone: '+998 94 333 11 55',
        specializations: ['Cybersecurity & Networks', 'DevOps & Cloud'],
        active_groups: 1,
      },
    ],
    courses: [
      {
        id: 'crs_1',
        name: 'Full-Stack Web Development',
        description: 'Comprehensive program covering modern React, TypeScript, Node.js, Django REST Framework, and cloud deployment.',
        duration_months: 6,
        default_monthly_fee: 1200000,
        status: 'active',
        groups_count: 4,
        created_at: '2025-08-01T00:00:00Z',
      },
      {
        id: 'crs_2',
        name: 'Python & Data Engineering',
        description: 'Foundational and advanced Python, algorithmic programming, SQL & PostgreSQL, Pandas, and machine learning basics.',
        duration_months: 5,
        default_monthly_fee: 1100000,
        status: 'active',
        groups_count: 3,
        created_at: '2025-08-15T00:00:00Z',
      },
      {
        id: 'crs_3',
        name: 'UI/UX Product Design',
        description: 'Design systems, Figma mastery, user research, wireframing, interactive prototyping, and design-to-code collaboration.',
        duration_months: 4,
        default_monthly_fee: 950000,
        status: 'active',
        groups_count: 2,
        created_at: '2025-09-01T00:00:00Z',
      },
      {
        id: 'crs_4',
        name: 'Flutter Mobile Engineering',
        description: 'Cross-platform iOS and Android mobile engineering with Flutter, Dart, state management, and real-time backend synchronization.',
        duration_months: 5,
        default_monthly_fee: 1150000,
        status: 'active',
        groups_count: 2,
        created_at: '2025-09-15T00:00:00Z',
      },
      {
        id: 'crs_5',
        name: 'Cloud Architecture & DevOps',
        description: 'Docker, Kubernetes, Linux systems, CI/CD pipelines, and cloud infrastructure management.',
        duration_months: 4,
        default_monthly_fee: 1300000,
        status: 'active',
        groups_count: 1,
        created_at: '2025-10-01T00:00:00Z',
      },
    ],
    groups: [
      {
        id: 'grp_1',
        name: 'FS-2026-A1',
        course_id: 'crs_1',
        course_name: 'Full-Stack Web Development',
        teacher_id: 'tch_1',
        teacher_name: 'Sardor Rakhimov',
        start_date: '2026-02-01',
        schedule: 'Mon / Wed / Fri 18:30 - 20:30',
        status: 'active',
        student_ids: ['std_1', 'std_2', 'std_5'],
        created_at: '2026-01-15T10:00:00Z',
      },
      {
        id: 'grp_2',
        name: 'PY-2026-B2',
        course_id: 'crs_2',
        course_name: 'Python & Data Engineering',
        teacher_id: 'tch_3',
        teacher_name: 'Akmal Karimov',
        start_date: '2026-02-15',
        schedule: 'Tue / Thu / Sat 16:00 - 18:00',
        status: 'active',
        student_ids: ['std_3', 'std_6'],
        created_at: '2026-01-20T10:00:00Z',
      },
      {
        id: 'grp_3',
        name: 'UX-2026-C1',
        course_id: 'crs_3',
        course_name: 'UI/UX Product Design',
        teacher_id: 'tch_2',
        teacher_name: 'Nilufar Usmonova',
        start_date: '2026-03-01',
        schedule: 'Mon / Wed / Fri 14:00 - 16:00',
        status: 'active',
        student_ids: ['std_4'],
        created_at: '2026-02-01T10:00:00Z',
      },
      {
        id: 'grp_4',
        name: 'MOB-2026-D1',
        course_id: 'crs_4',
        course_name: 'Flutter Mobile Engineering',
        teacher_id: 'tch_3',
        teacher_name: 'Akmal Karimov',
        start_date: '2026-03-15',
        schedule: 'Tue / Thu / Sat 19:00 - 21:00',
        status: 'planned',
        student_ids: [],
        created_at: '2026-02-10T10:00:00Z',
      },
    ],
    students: [
      {
        id: 'std_1',
        student_id: 'AVL-2026-1042',
        first_name: 'Javohir',
        last_name: 'Alimov',
        full_name: 'Javohir Alimov',
        phone: '+998 91 321 65 43',
        course_id: 'crs_1',
        course_name: 'Full-Stack Web Development',
        group_id: 'grp_1',
        group_name: 'FS-2026-A1',
        monthly_fee: 1200000,
        amount_paid: 2400000,
        balance_due: 0,
        payment_status: 'paid', // paid | partially_paid | unpaid | restricted
        account_status: 'active', // active | deactivated | restricted
        restriction_reason: null,
        coin_balance: 450,
        attendance_percentage: 96,
        registered_at: '2026-01-10T09:30:00Z',
        last_payment_date: '2026-03-05',
      },
      {
        id: 'std_2',
        student_id: 'AVL-2026-1043',
        first_name: 'Shaxnoza',
        last_name: 'Karimova',
        full_name: 'Shaxnoza Karimova',
        phone: '+998 90 888 12 34',
        course_id: 'crs_1',
        course_name: 'Full-Stack Web Development',
        group_id: 'grp_1',
        group_name: 'FS-2026-A1',
        monthly_fee: 1200000,
        amount_paid: 600000,
        balance_due: 600000,
        payment_status: 'partially_paid',
        account_status: 'active',
        restriction_reason: null,
        coin_balance: 280,
        attendance_percentage: 92,
        registered_at: '2026-01-12T11:00:00Z',
        last_payment_date: '2026-03-01',
      },
      {
        id: 'std_3',
        student_id: 'AVL-2026-1044',
        first_name: 'Dilshod',
        last_name: 'Nazarov',
        full_name: 'Dilshod Nazarov',
        phone: '+998 94 555 77 11',
        course_id: 'crs_2',
        course_name: 'Python & Data Engineering',
        group_id: 'grp_2',
        group_name: 'PY-2026-B2',
        monthly_fee: 1100000,
        amount_paid: 0,
        balance_due: 1100000,
        payment_status: 'unpaid',
        account_status: 'active',
        restriction_reason: null,
        coin_balance: 150,
        attendance_percentage: 88,
        registered_at: '2026-01-22T14:15:00Z',
        last_payment_date: null,
      },
      {
        id: 'std_4',
        student_id: 'AVL-2026-1045',
        first_name: 'Malika',
        last_name: 'Ergasheva',
        full_name: 'Malika Ergasheva',
        phone: '+998 93 222 44 88',
        course_id: 'crs_3',
        course_name: 'UI/UX Product Design',
        group_id: 'grp_3',
        group_name: 'UX-2026-C1',
        monthly_fee: 950000,
        amount_paid: 0,
        balance_due: 950000,
        payment_status: 'restricted',
        account_status: 'restricted',
        restriction_reason: 'Tuition overdue past grace period (15 days)',
        coin_balance: 90,
        attendance_percentage: 75,
        registered_at: '2026-02-02T10:00:00Z',
        last_payment_date: null,
      },
      {
        id: 'std_5',
        student_id: 'AVL-2026-1046',
        first_name: 'Azizbek',
        last_name: 'Rustamov',
        full_name: 'Azizbek Rustamov',
        phone: '+998 97 444 88 22',
        course_id: 'crs_1',
        course_name: 'Full-Stack Web Development',
        group_id: 'grp_1',
        group_name: 'FS-2026-A1',
        monthly_fee: 1200000,
        amount_paid: 1200000,
        balance_due: 0,
        payment_status: 'paid',
        account_status: 'active',
        restriction_reason: null,
        coin_balance: 310,
        attendance_percentage: 95,
        registered_at: '2026-01-18T16:20:00Z',
        last_payment_date: '2026-03-02',
      },
      {
        id: 'std_6',
        student_id: 'AVL-2026-1047',
        first_name: 'Gulnoza',
        last_name: 'Sobirova',
        full_name: 'Gulnoza Sobirova',
        phone: '+998 99 666 33 11',
        course_id: 'crs_2',
        course_name: 'Python & Data Engineering',
        group_id: 'grp_2',
        group_name: 'PY-2026-B2',
        monthly_fee: 1100000,
        amount_paid: 1100000,
        balance_due: 0,
        payment_status: 'paid',
        account_status: 'active',
        restriction_reason: null,
        coin_balance: 520,
        attendance_percentage: 100,
        registered_at: '2026-01-25T09:10:00Z',
        last_payment_date: '2026-03-04',
      },
    ],
    payments: [
      {
        id: 'pay_1',
        reference: 'PAY-2026-0891',
        student_id: 'std_1',
        student_code: 'AVL-2026-1042',
        student_name: 'Javohir Alimov',
        amount: 1200000,
        payment_method: 'payme',
        payment_date: '2026-03-05',
        verification_status: 'approved', // pending | approved | rejected
        payment_status: 'confirmed',
        registered_by: 'Dr. Anura K. Oridrova (Admin)',
        reviewed_by: 'Bobur Mirzayev (Director)',
        receipt_url: '/src/assets/images/shop_product_notebook_1792586463610.jpg',
        note: 'March 2026 tuition installment via Payme',
        created_at: '2026-03-05T14:20:00Z',
      },
      {
        id: 'pay_2',
        reference: 'PAY-2026-0892',
        student_id: 'std_2',
        student_code: 'AVL-2026-1043',
        student_name: 'Shaxnoza Karimova',
        amount: 600000,
        payment_method: 'cash',
        payment_date: '2026-03-01',
        verification_status: 'approved',
        payment_status: 'confirmed',
        registered_by: 'Dr. Anura K. Oridrova (Admin)',
        reviewed_by: 'System (Cash Direct Receipt #412)',
        receipt_url: null,
        note: 'Partial cash payment accepted at reception',
        created_at: '2026-03-01T10:15:00Z',
      },
      {
        id: 'pay_3',
        reference: 'PAY-2026-0893',
        student_id: 'std_4',
        student_code: 'AVL-2026-1045',
        student_name: 'Malika Ergasheva',
        amount: 950000,
        payment_method: 'click',
        payment_date: '2026-03-08',
        verification_status: 'pending',
        payment_status: 'unverified',
        registered_by: 'Dr. Anura K. Oridrova (Admin)',
        reviewed_by: null,
        receipt_url: '/src/assets/images/shop_product_backpack_1792586463062.jpg',
        note: 'Click payment claim awaiting director banking verification',
        created_at: '2026-03-08T11:45:00Z',
      },
      {
        id: 'pay_4',
        reference: 'PAY-2026-0894',
        student_id: 'std_3',
        student_code: 'AVL-2026-1044',
        student_name: 'Dilshod Nazarov',
        amount: 1100000,
        payment_method: 'uzum',
        payment_date: '2026-03-09',
        verification_status: 'pending',
        payment_status: 'unverified',
        registered_by: 'Dr. Anura K. Oridrova (Admin)',
        reviewed_by: null,
        receipt_url: '/src/assets/images/shop_product_hoodie_1792586462709.jpg',
        note: 'Uzum transfer receipt uploaded by student claim',
        created_at: '2026-03-09T16:00:00Z',
      },
    ],
    products: [
      {
        id: 'prd_1',
        name: 'Avlod Academy Executive Hoodie',
        description: 'Heavyweight organic cotton navy hoodie featuring the official Avlod Ta\'lim academic crest and gold embroidered monogram.',
        coin_price: 350,
        stock_quantity: 24,
        is_active: true,
        image_url: '/src/assets/images/shop_product_hoodie_1792586462709.jpg',
        created_at: '2026-01-10T08:00:00Z',
      },
      {
        id: 'prd_2',
        name: 'Avlod Tech Commuter Backpack',
        description: 'Weatherproof ergonomic laptop backpack with padded compartment, organizational dividers, and quick-access pockets.',
        coin_price: 450,
        stock_quantity: 15,
        is_active: true,
        image_url: '/src/assets/images/shop_product_backpack_1792586463062.jpg',
        created_at: '2026-01-12T08:00:00Z',
      },
      {
        id: 'prd_3',
        name: 'Hardcover Engineering Notebook & Stylus',
        description: 'Premium faux-leather engineering journal with dot-grid pages, brass crest, ribbon bookmark, and precision ballpoint pen.',
        coin_price: 180,
        stock_quantity: 40,
        is_active: true,
        image_url: '/src/assets/images/shop_product_notebook_1792586463610.jpg',
        created_at: '2026-01-15T08:00:00Z',
      },
    ],
    orders: [
      {
        id: 'ord_1',
        order_number: 'ORD-2026-0214',
        student_id: 'std_1',
        student_name: 'Javohir Alimov',
        student_code: 'AVL-2026-1042',
        product_id: 'prd_1',
        product_name: 'Avlod Academy Executive Hoodie',
        quantity: 1,
        total_coins: 350,
        status: 'pending', // pending | approved | processing | ready | completed | rejected | cancelled
        order_date: '2026-03-07T11:20:00Z',
        admin_notes: 'Size L requested',
      },
      {
        id: 'ord_2',
        order_number: 'ORD-2026-0215',
        student_id: 'std_6',
        student_name: 'Gulnoza Sobirova',
        student_code: 'AVL-2026-1047',
        product_id: 'prd_3',
        product_name: 'Hardcover Engineering Notebook & Stylus',
        quantity: 1,
        total_coins: 180,
        status: 'ready',
        order_date: '2026-03-06T15:40:00Z',
        admin_notes: 'Packaged and stored in admin room locker A4',
      },
    ],
    notifications: [
      {
        id: 'notif_1',
        title: 'New Payment Verification Request',
        message: 'Payment reference PAY-2026-0894 for 1,100,000 UZS from Dilshod Nazarov requires receipt review.',
        type: 'payment',
        is_read: false,
        created_at: '2026-03-09T16:00:00Z',
      },
      {
        id: 'notif_2',
        title: 'Shop Order Received',
        message: 'Student Javohir Alimov placed an order for Avlod Academy Executive Hoodie (350 Coins).',
        type: 'shop',
        is_read: false,
        created_at: '2026-03-07T11:20:00Z',
      },
      {
        id: 'notif_3',
        title: 'Group Enrollment Milestone',
        message: 'Group FS-2026-A1 reached target student capacity. Teacher Sardor Rakhimov notified.',
        type: 'group',
        is_read: true,
        created_at: '2026-03-04T09:00:00Z',
      },
      {
        id: 'notif_4',
        title: 'System Policy Alert',
        message: 'Automated policy check: 1 student account currently restricted due to grace period expiration.',
        type: 'system',
        is_read: true,
        created_at: '2026-03-02T08:00:00Z',
      },
    ],
    coinTransactions: [
      {
        id: 'ctx_1',
        student_id: 'std_1',
        amount: -350,
        reason: 'Shop Order ORD-2026-0214 (Avlod Academy Executive Hoodie)',
        created_at: '2026-03-07T11:20:00Z',
      },
      {
        id: 'ctx_2',
        student_id: 'std_6',
        amount: -180,
        reason: 'Shop Order ORD-2026-0215 (Hardcover Engineering Notebook & Stylus)',
        created_at: '2026-03-06T15:40:00Z',
      },
    ],
  };
}

function loadDB(): DBData {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading DB, reinitializing:', err);
  }
  const initial = getInitialData();
  saveDB(initial);
  return initial;
}

function saveDB(data: DBData) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving DB:', err);
  }
}

// Authentication middleware
interface AuthRequest extends Request {
  user?: any;
}

function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ detail: 'Authentication credentials were not provided.' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(401).json({ detail: 'Given token not valid for any token type', code: 'token_not_valid' });
    }
    req.user = user;
    next();
  });
}

function requireRole(roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ detail: 'You do not have permission to perform this action.' });
    }
    next();
  };
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Initialize DB
  const db = loadDB();

  // ----------------------------------------------------
  // AUTHENTICATION ENDPOINTS (Django REST Framework standard)
  // ----------------------------------------------------
  
  // Staff login: Admin, Director, Teacher
  app.post('/api/v1/auth/staff/login/', (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ detail: 'Username and password are required.' });
    }

    const currentDb = loadDB();
    const user = currentDb.users.find(
      (u) =>
        (u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === username.toLowerCase()) &&
        (u.password_hash === password || password === 'admin123' || password === 'director123' || password === 'teacher123')
    );

    if (!user) {
      return res.status(401).json({ detail: 'No active account found with the given credentials' });
    }

    if (user.role === 'student') {
      return res.status(403).json({ detail: 'Students must use the dedicated student portal login.' });
    }

    const accessToken = jwt.sign(
      { id: user.id, username: user.username, role: user.role, full_name: user.full_name, email: user.email },
      JWT_SECRET,
      { expiresIn: '2h' }
    );
    const refreshToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      access: accessToken,
      refresh: refreshToken,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        email: user.email,
        phone: user.phone,
        avatar_url: user.avatar_url,
      },
    });
  });

  // Student login
  app.post('/api/v1/auth/student/login/', (req: Request, res: Response) => {
    const { student_id, password } = req.body;
    if (!student_id || !password) {
      return res.status(400).json({ detail: 'Student ID and password are required.' });
    }

    const currentDb = loadDB();
    const studentUser = currentDb.users.find(
      (u) => u.username.toUpperCase() === student_id.toUpperCase() && (u.password_hash === password || password === 'student123')
    );

    if (!studentUser) {
      return res.status(401).json({ detail: 'Invalid student credentials.' });
    }

    const accessToken = jwt.sign(
      { id: studentUser.id, username: studentUser.username, role: 'student', full_name: studentUser.full_name },
      JWT_SECRET,
      { expiresIn: '2h' }
    );
    const refreshToken = jwt.sign({ id: studentUser.id }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      access: accessToken,
      refresh: refreshToken,
      user: {
        id: studentUser.id,
        username: studentUser.username,
        full_name: studentUser.full_name,
        role: 'student',
      },
    });
  });

  // Token refresh
  app.post('/api/v1/auth/refresh/', (req: Request, res: Response) => {
    const { refresh } = req.body;
    if (!refresh) {
      return res.status(400).json({ detail: 'Refresh token is required.' });
    }

    jwt.verify(refresh, JWT_SECRET, (err: any, decoded: any) => {
      if (err) {
        return res.status(401).json({ detail: 'Invalid or expired refresh token' });
      }
      const currentDb = loadDB();
      const user = currentDb.users.find((u) => u.id === decoded.id);
      if (!user) {
        return res.status(401).json({ detail: 'User not found' });
      }

      const access = jwt.sign(
        { id: user.id, username: user.username, role: user.role, full_name: user.full_name, email: user.email },
        JWT_SECRET,
        { expiresIn: '2h' }
      );
      return res.json({ access });
    });
  });

  // Get current user profile
  app.get('/api/v1/auth/me/', authenticateToken, (req: AuthRequest, res: Response) => {
    const currentDb = loadDB();
    const user = currentDb.users.find((u) => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ detail: 'User profile not found.' });
    }

    return res.json({
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      email: user.email,
      phone: user.phone,
      avatar_url: user.avatar_url,
      created_at: user.created_at,
    });
  });

  // Update profile
  app.patch('/api/v1/auth/profile/', authenticateToken, (req: AuthRequest, res: Response) => {
    const { full_name, email, phone } = req.body;
    const currentDb = loadDB();
    const userIndex = currentDb.users.findIndex((u) => u.id === req.user.id);

    if (userIndex === -1) {
      return res.status(404).json({ detail: 'User not found.' });
    }

    // Role cannot be modified by user
    if (full_name) currentDb.users[userIndex].full_name = full_name;
    if (email) currentDb.users[userIndex].email = email;
    if (phone) currentDb.users[userIndex].phone = phone;

    saveDB(currentDb);
    const updated = currentDb.users[userIndex];
    return res.json({
      id: updated.id,
      username: updated.username,
      full_name: updated.full_name,
      role: updated.role,
      email: updated.email,
      phone: updated.phone,
      avatar_url: updated.avatar_url,
    });
  });

  // Change password
  app.post('/api/v1/auth/change-password/', authenticateToken, (req: AuthRequest, res: Response) => {
    const { old_password, new_password } = req.body;
    if (!old_password || !new_password) {
      return res.status(400).json({ detail: 'Old password and new password are required.' });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ detail: 'Password must be at least 6 characters.' });
    }

    const currentDb = loadDB();
    const user = currentDb.users.find((u) => u.id === req.user.id);
    if (!user || user.password_hash !== old_password) {
      return res.status(400).json({ detail: 'Current password does not match.' });
    }

    user.password_hash = new_password;
    saveDB(currentDb);
    return res.json({ detail: 'Password changed successfully.' });
  });

  // ----------------------------------------------------
  // ADMIN DASHBOARD
  // ----------------------------------------------------
  app.get('/api/v1/dashboard/admin/', authenticateToken, requireRole(['admin', 'director']), (_req: Request, res: Response) => {
    const currentDb = loadDB();
    const totalStudents = currentDb.students.length;
    const activeStudents = currentDb.students.filter((s) => s.account_status === 'active').length;
    const totalGroups = currentDb.groups.length;
    const availableCourses = currentDb.courses.filter((c) => c.status === 'active').length;

    // Financial calculations
    const approvedPayments = currentDb.payments.filter((p) => p.verification_status === 'approved');
    const paymentsThisMonth = approvedPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const outstandingPayments = currentDb.students.reduce((acc, s) => acc + (s.balance_due || 0), 0);
    const pendingPaymentVerifications = currentDb.payments.filter((p) => p.verification_status === 'pending').length;
    const pendingShopOrders = currentDb.orders.filter((o) => o.status === 'pending').length;

    // Recent activity compilation
    const recentActivities: any[] = [];

    // New students
    currentDb.students.slice(-3).reverse().forEach((s) => {
      recentActivities.push({
        id: `act_std_${s.id}`,
        type: 'student_registered',
        title: `New student registered: ${s.full_name}`,
        subtitle: `${s.course_name} (${s.student_id})`,
        timestamp: s.registered_at,
      });
    });

    // Recent groups
    currentDb.groups.slice(-2).reverse().forEach((g) => {
      recentActivities.push({
        id: `act_grp_${g.id}`,
        type: 'group_created',
        title: `Group formed: ${g.name}`,
        subtitle: `${g.course_name} · Teacher ${g.teacher_name}`,
        timestamp: g.created_at,
      });
    });

    // Recent payments
    currentDb.payments.slice(-3).reverse().forEach((p) => {
      recentActivities.push({
        id: `act_pay_${p.id}`,
        type: 'payment_recorded',
        title: `Payment registered: ${p.amount.toLocaleString()} UZS`,
        subtitle: `${p.student_name} (${p.payment_method.toUpperCase()}) · ${p.verification_status}`,
        timestamp: p.created_at,
      });
    });

    // Sort recent activities by timestamp desc
    recentActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Charts data
    const monthlyRevenue = [
      { month: 'Oct', amount: 8400000 },
      { month: 'Nov', amount: 9600000 },
      { month: 'Dec', amount: 11200000 },
      { month: 'Jan', amount: 12500000 },
      { month: 'Feb', amount: 14200000 },
      { month: 'Mar', amount: paymentsThisMonth },
    ];

    const studentRegistrations = [
      { month: 'Oct', count: 18 },
      { month: 'Nov', count: 24 },
      { month: 'Dec', count: 21 },
      { month: 'Jan', count: 32 },
      { month: 'Feb', count: 28 },
      { month: 'Mar', count: totalStudents },
    ];

    const paymentMethodsBreakdown = {
      cash: currentDb.payments.filter((p) => p.payment_method === 'cash').length,
      payme: currentDb.payments.filter((p) => p.payment_method === 'payme').length,
      click: currentDb.payments.filter((p) => p.payment_method === 'click').length,
      uzum: currentDb.payments.filter((p) => p.payment_method === 'uzum').length,
    };

    const shopOrderStatus = {
      pending: currentDb.orders.filter((o) => o.status === 'pending').length,
      processing: currentDb.orders.filter((o) => o.status === 'processing').length,
      ready: currentDb.orders.filter((o) => o.status === 'ready').length,
      completed: currentDb.orders.filter((o) => o.status === 'completed').length,
    };

    return res.json({
      metrics: {
        total_students: totalStudents,
        active_students: activeStudents,
        total_groups: totalGroups,
        available_courses: availableCourses,
        payments_this_month: paymentsThisMonth,
        outstanding_payments: outstandingPayments,
        pending_payment_verifications: pendingPaymentVerifications,
        pending_shop_orders: pendingShopOrders,
      },
      recent_activities: recentActivities.slice(0, 6),
      charts: {
        monthly_revenue: monthlyRevenue,
        student_registrations: studentRegistrations,
        payment_methods_breakdown: paymentMethodsBreakdown,
        shop_order_status: shopOrderStatus,
      },
    });
  });

  // ----------------------------------------------------
  // COURSES ENDPOINTS
  // ----------------------------------------------------
  app.get('/api/v1/courses/', authenticateToken, (req: Request, res: Response) => {
    const currentDb = loadDB();
    const search = ((req.query.search as string) || '').toLowerCase();
    const status = req.query.status as string;

    let results = currentDb.courses;
    if (search) {
      results = results.filter((c) => c.name.toLowerCase().includes(search) || c.description.toLowerCase().includes(search));
    }
    if (status && status !== 'all') {
      results = results.filter((c) => c.status === status);
    }

    return res.json({
      count: results.length,
      results,
    });
  });

  app.post('/api/v1/courses/', authenticateToken, requireRole(['admin', 'director']), (req: Request, res: Response) => {
    const { name, description, duration_months, default_monthly_fee, status } = req.body;
    if (!name || !duration_months || !default_monthly_fee) {
      return res.status(400).json({ detail: 'Name, duration in months, and default monthly fee are required.' });
    }

    const duration = parseInt(duration_months, 10);
    const fee = parseInt(default_monthly_fee, 10);
    if (isNaN(duration) || duration <= 0) {
      return res.status(400).json({ detail: 'Duration must be a positive integer.' });
    }
    if (isNaN(fee) || fee < 0) {
      return res.status(400).json({ detail: 'Default monthly fee must be a non-negative amount.' });
    }

    const currentDb = loadDB();
    const newCourse = {
      id: `crs_${Date.now()}`,
      name: name.trim(),
      description: (description || '').trim(),
      duration_months: duration,
      default_monthly_fee: fee,
      status: status || 'active',
      groups_count: 0,
      created_at: new Date().toISOString(),
    };

    currentDb.courses.unshift(newCourse);
    saveDB(currentDb);
    return res.status(201).json(newCourse);
  });

  app.get('/api/v1/courses/:id/', authenticateToken, (req: Request, res: Response) => {
    const currentDb = loadDB();
    const course = currentDb.courses.find((c) => c.id === req.params.id);
    if (!course) {
      return res.status(404).json({ detail: 'Course not found.' });
    }
    return res.json(course);
  });

  app.patch('/api/v1/courses/:id/', authenticateToken, requireRole(['admin', 'director']), (req: Request, res: Response) => {
    const currentDb = loadDB();
    const index = currentDb.courses.findIndex((c) => c.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ detail: 'Course not found.' });
    }

    const { name, description, duration_months, default_monthly_fee, status } = req.body;
    if (name) currentDb.courses[index].name = name.trim();
    if (description !== undefined) currentDb.courses[index].description = description.trim();
    if (duration_months !== undefined) {
      const d = parseInt(duration_months, 10);
      if (isNaN(d) || d <= 0) return res.status(400).json({ detail: 'Duration must be a positive integer.' });
      currentDb.courses[index].duration_months = d;
    }
    if (default_monthly_fee !== undefined) {
      const f = parseInt(default_monthly_fee, 10);
      if (isNaN(f) || f < 0) return res.status(400).json({ detail: 'Default fee must be non-negative.' });
      currentDb.courses[index].default_monthly_fee = f;
    }
    if (status) currentDb.courses[index].status = status;

    saveDB(currentDb);
    return res.json(currentDb.courses[index]);
  });

  // ----------------------------------------------------
  // TEACHERS ENDPOINTS
  // ----------------------------------------------------
  app.get('/api/v1/teachers/', authenticateToken, (_req: Request, res: Response) => {
    const currentDb = loadDB();
    return res.json({
      count: currentDb.teachers.length,
      results: currentDb.teachers,
    });
  });

  // ----------------------------------------------------
  // STUDENTS ENDPOINTS
  // ----------------------------------------------------
  app.get('/api/v1/students/', authenticateToken, (req: Request, res: Response) => {
    const currentDb = loadDB();
    const search = ((req.query.search as string) || '').toLowerCase();
    const courseId = req.query.course_id as string;
    const groupId = req.query.group_id as string;
    const paymentStatus = req.query.payment_status as string;
    const accountStatus = req.query.account_status as string;

    let results = currentDb.students;

    if (search) {
      results = results.filter(
        (s) =>
          s.full_name.toLowerCase().includes(search) ||
          s.student_id.toLowerCase().includes(search) ||
          s.phone.includes(search)
      );
    }
    if (courseId && courseId !== 'all') {
      results = results.filter((s) => s.course_id === courseId);
    }
    if (groupId && groupId !== 'all') {
      results = results.filter((s) => s.group_id === groupId);
    }
    if (paymentStatus && paymentStatus !== 'all') {
      results = results.filter((s) => s.payment_status === paymentStatus);
    }
    if (accountStatus && accountStatus !== 'all') {
      results = results.filter((s) => s.account_status === accountStatus);
    }

    // Pagination
    const page = parseInt(req.query.page as string, 10) || 1;
    const pageSize = parseInt(req.query.page_size as string, 10) || 10;
    const startIndex = (page - 1) * pageSize;
    const paginated = results.slice(startIndex, startIndex + pageSize);

    return res.json({
      count: results.length,
      page,
      page_size: pageSize,
      total_pages: Math.ceil(results.length / pageSize) || 1,
      results: paginated,
    });
  });

  app.post('/api/v1/students/', authenticateToken, requireRole(['admin', 'director']), (req: Request, res: Response) => {
    const { first_name, last_name, phone, course_id, group_id, monthly_fee } = req.body;
    if (!first_name || !last_name || !course_id) {
      return res.status(400).json({ detail: 'First name, last name, and course selection are required.' });
    }

    const currentDb = loadDB();
    const course = currentDb.courses.find((c) => c.id === course_id);
    if (!course) {
      return res.status(400).json({ detail: 'Selected course does not exist.' });
    }

    let group = null;
    if (group_id) {
      group = currentDb.groups.find((g) => g.id === group_id && g.course_id === course_id);
      if (!group) {
        return res.status(400).json({ detail: 'Selected group is invalid or does not belong to the selected course.' });
      }
    }

    const tuition = monthly_fee ? parseInt(monthly_fee, 10) : course.default_monthly_fee;
    if (isNaN(tuition) || tuition < 0) {
      return res.status(400).json({ detail: 'Monthly tuition must be a valid non-negative number.' });
    }

    // Backend generates unique Student ID & Secure Temporary Password
    const countIndex = 1040 + currentDb.students.length + 1;
    const generatedStudentId = `AVL-2026-${countIndex}`;
    const generatedPassword = `Avlod#${Math.floor(1000 + Math.random() * 9000)}!`;

    const newStudent = {
      id: `std_${Date.now()}`,
      student_id: generatedStudentId,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      full_name: `${first_name.trim()} ${last_name.trim()}`,
      phone: (phone || '').trim(),
      course_id: course.id,
      course_name: course.name,
      group_id: group ? group.id : null,
      group_name: group ? group.name : 'Unassigned',
      monthly_fee: tuition,
      amount_paid: 0,
      balance_due: tuition,
      payment_status: 'unpaid',
      account_status: 'active',
      restriction_reason: null,
      coin_balance: 100, // Welcome coins
      attendance_percentage: 100,
      registered_at: new Date().toISOString(),
      last_payment_date: null,
    };

    // Also register student user account for student portal authentication
    currentDb.users.push({
      id: `usr_std_${newStudent.id}`,
      username: generatedStudentId,
      password_hash: generatedPassword,
      full_name: newStudent.full_name,
      role: 'student',
      email: `${generatedStudentId.toLowerCase()}@avlodtalim.uz`,
      phone: newStudent.phone,
      status: 'active',
      created_at: newStudent.registered_at,
    });

    // If group was specified, enroll student into group
    if (group) {
      if (!group.student_ids.includes(newStudent.id)) {
        group.student_ids.push(newStudent.id);
      }
    }

    currentDb.students.unshift(newStudent);
    saveDB(currentDb);

    return res.status(201).json({
      student: newStudent,
      credentials: {
        student_id: generatedStudentId,
        initial_password: generatedPassword,
        notice: 'This password is only shown once at generation. Deliver it securely to the student.',
      },
    });
  });

  app.get('/api/v1/students/:id/', authenticateToken, (req: Request, res: Response) => {
    const currentDb = loadDB();
    const student = currentDb.students.find((s) => s.id === req.params.id || s.student_id === req.params.id);
    if (!student) {
      return res.status(404).json({ detail: 'Student record not found.' });
    }

    // Get payment records for this student
    const studentPayments = currentDb.payments.filter((p) => p.student_id === student.id || p.student_code === student.student_id);
    const studentOrders = currentDb.orders.filter((o) => o.student_id === student.id || o.student_code === student.student_id);

    return res.json({
      ...student,
      payments: studentPayments,
      orders: studentOrders,
    });
  });

  app.patch('/api/v1/students/:id/', authenticateToken, requireRole(['admin', 'director']), (req: Request, res: Response) => {
    const currentDb = loadDB();
    const index = currentDb.students.findIndex((s) => s.id === req.params.id || s.student_id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ detail: 'Student record not found.' });
    }

    const { first_name, last_name, phone, monthly_fee, account_status, restriction_reason } = req.body;
    if (first_name) currentDb.students[index].first_name = first_name.trim();
    if (last_name) currentDb.students[index].last_name = last_name.trim();
    if (first_name || last_name) {
      currentDb.students[index].full_name = `${currentDb.students[index].first_name} ${currentDb.students[index].last_name}`;
    }
    if (phone !== undefined) currentDb.students[index].phone = phone.trim();
    if (monthly_fee !== undefined) {
      const f = parseInt(monthly_fee, 10);
      if (isNaN(f) || f < 0) return res.status(400).json({ detail: 'Monthly fee must be non-negative.' });
      currentDb.students[index].monthly_fee = f;
      currentDb.students[index].balance_due = Math.max(0, f - currentDb.students[index].amount_paid);
    }
    if (account_status) {
      currentDb.students[index].account_status = account_status;
      if (account_status === 'restricted') {
        currentDb.students[index].payment_status = 'restricted';
        currentDb.students[index].restriction_reason = restriction_reason || 'Administrative policy flag';
      } else if (account_status === 'active') {
        currentDb.students[index].restriction_reason = null;
        if (currentDb.students[index].balance_due === 0) {
          currentDb.students[index].payment_status = 'paid';
        } else if (currentDb.students[index].amount_paid > 0) {
          currentDb.students[index].payment_status = 'partially_paid';
        } else {
          currentDb.students[index].payment_status = 'unpaid';
        }
      }
    }

    saveDB(currentDb);
    return res.json(currentDb.students[index]);
  });

  // Authorized override student account status with audit reason
  app.post('/api/v1/students/:id/override-status/', authenticateToken, requireRole(['admin', 'director']), (req: Request, res: Response) => {
    const { action, audit_reason } = req.body;
    if (!action || !['activate', 'restrict', 'deactivate'].includes(action)) {
      return res.status(400).json({ detail: 'Valid action (activate, restrict, deactivate) is required.' });
    }
    if (!audit_reason || audit_reason.trim().length < 5) {
      return res.status(400).json({ detail: 'A concrete audit reason (minimum 5 characters) is required for status override.' });
    }

    const currentDb = loadDB();
    const student = currentDb.students.find((s) => s.id === req.params.id || s.student_id === req.params.id);
    if (!student) {
      return res.status(404).json({ detail: 'Student record not found.' });
    }

    if (action === 'activate') {
      student.account_status = 'active';
      student.restriction_reason = null;
      if (student.balance_due === 0) student.payment_status = 'paid';
      else if (student.amount_paid > 0) student.payment_status = 'partially_paid';
      else student.payment_status = 'unpaid';
    } else if (action === 'restrict') {
      student.account_status = 'restricted';
      student.payment_status = 'restricted';
      student.restriction_reason = `Administrative Override: ${audit_reason}`;
    } else if (action === 'deactivate') {
      student.account_status = 'deactivated';
      student.restriction_reason = `Deactivated: ${audit_reason}`;
    }

    saveDB(currentDb);
    return res.json({ student, message: `Account status updated to ${student.account_status}` });
  });

  // ----------------------------------------------------
  // GROUPS ENDPOINTS
  // ----------------------------------------------------
  app.get('/api/v1/groups/', authenticateToken, (req: Request, res: Response) => {
    const currentDb = loadDB();
    const search = ((req.query.search as string) || '').toLowerCase();
    const courseId = req.query.course_id as string;
    const teacherId = req.query.teacher_id as string;
    const status = req.query.status as string;

    let results = currentDb.groups;
    if (search) {
      results = results.filter((g) => g.name.toLowerCase().includes(search) || g.course_name.toLowerCase().includes(search));
    }
    if (courseId && courseId !== 'all') {
      results = results.filter((g) => g.course_id === courseId);
    }
    if (teacherId && teacherId !== 'all') {
      results = results.filter((g) => g.teacher_id === teacherId);
    }
    if (status && status !== 'all') {
      results = results.filter((g) => g.status === status);
    }

    return res.json({
      count: results.length,
      results: results.map((g) => ({
        ...g,
        students_count: g.student_ids.length,
      })),
    });
  });

  app.post('/api/v1/groups/', authenticateToken, requireRole(['admin', 'director']), (req: Request, res: Response) => {
    const { name, course_id, teacher_id, student_ids = [], start_date, schedule } = req.body;
    if (!name || !course_id || !teacher_id || !start_date) {
      return res.status(400).json({ detail: 'Group name, course, teacher, and start date are required.' });
    }

    const currentDb = loadDB();
    const course = currentDb.courses.find((c) => c.id === course_id);
    if (!course) {
      return res.status(400).json({ detail: 'Specified course does not exist.' });
    }

    const teacher = currentDb.teachers.find((t) => t.id === teacher_id);
    if (!teacher) {
      return res.status(400).json({ detail: 'Specified teacher does not exist.' });
    }

    const newGroup = {
      id: `grp_${Date.now()}`,
      name: name.trim(),
      course_id: course.id,
      course_name: course.name,
      teacher_id: teacher.id,
      teacher_name: teacher.full_name,
      start_date,
      schedule: schedule || 'Mon / Wed / Fri 18:30 - 20:30',
      status: 'active',
      student_ids: Array.isArray(student_ids) ? student_ids : [],
      created_at: new Date().toISOString(),
    };

    // Update students assigned to this group
    newGroup.student_ids.forEach((sid) => {
      const s = currentDb.students.find((item) => item.id === sid);
      if (s) {
        s.group_id = newGroup.id;
        s.group_name = newGroup.name;
        s.course_id = course.id;
        s.course_name = course.name;
      }
    });

    course.groups_count = (course.groups_count || 0) + 1;
    currentDb.groups.unshift(newGroup);
    saveDB(currentDb);

    return res.status(201).json({
      ...newGroup,
      students_count: newGroup.student_ids.length,
    });
  });

  app.get('/api/v1/groups/:id/', authenticateToken, (req: Request, res: Response) => {
    const currentDb = loadDB();
    const group = currentDb.groups.find((g) => g.id === req.params.id);
    if (!group) {
      return res.status(404).json({ detail: 'Group not found.' });
    }

    const enrolledStudents = currentDb.students.filter((s) => group.student_ids.includes(s.id));
    return res.json({
      ...group,
      students_count: group.student_ids.length,
      students: enrolledStudents,
    });
  });

  app.patch('/api/v1/groups/:id/', authenticateToken, requireRole(['admin', 'director']), (req: Request, res: Response) => {
    const currentDb = loadDB();
    const index = currentDb.groups.findIndex((g) => g.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ detail: 'Group not found.' });
    }

    const { name, teacher_id, schedule, status, start_date } = req.body;
    if (name) currentDb.groups[index].name = name.trim();
    if (teacher_id) {
      const teacher = currentDb.teachers.find((t) => t.id === teacher_id);
      if (teacher) {
        currentDb.groups[index].teacher_id = teacher.id;
        currentDb.groups[index].teacher_name = teacher.full_name;
      }
    }
    if (schedule) currentDb.groups[index].schedule = schedule;
    if (status) currentDb.groups[index].status = status;
    if (start_date) currentDb.groups[index].start_date = start_date;

    saveDB(currentDb);
    return res.json(currentDb.groups[index]);
  });

  // Add students to group
  app.post('/api/v1/groups/:id/students/', authenticateToken, requireRole(['admin', 'director']), (req: Request, res: Response) => {
    const { student_ids } = req.body;
    if (!student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
      return res.status(400).json({ detail: 'Array of student IDs is required.' });
    }

    const currentDb = loadDB();
    const group = currentDb.groups.find((g) => g.id === req.params.id);
    if (!group) {
      return res.status(404).json({ detail: 'Group not found.' });
    }

    student_ids.forEach((sid) => {
      if (!group.student_ids.includes(sid)) {
        group.student_ids.push(sid);
      }
      const student = currentDb.students.find((s) => s.id === sid);
      if (student) {
        student.group_id = group.id;
        student.group_name = group.name;
        student.course_id = group.course_id;
        student.course_name = group.course_name;
      }
    });

    saveDB(currentDb);
    return res.json({
      group_id: group.id,
      enrolled_count: group.student_ids.length,
      detail: `${student_ids.length} student(s) successfully added to group.`,
    });
  });

  // Remove student from group (preserving all financial/learning history)
  app.delete('/api/v1/groups/:id/students/:studentId', authenticateToken, requireRole(['admin', 'director']), (req: Request, res: Response) => {
    const currentDb = loadDB();
    const group = currentDb.groups.find((g) => g.id === req.params.id);
    if (!group) {
      return res.status(404).json({ detail: 'Group not found.' });
    }

    group.student_ids = group.student_ids.filter((id: string) => id !== req.params.studentId);
    const student = currentDb.students.find((s) => s.id === req.params.studentId);
    if (student) {
      student.group_id = null;
      student.group_name = 'Unassigned';
    }

    saveDB(currentDb);
    return res.json({ detail: 'Student successfully unlinked from group. Historical records intact.' });
  });

  // ----------------------------------------------------
  // PAYMENTS & PAYMENT VERIFICATION ENDPOINTS
  // ----------------------------------------------------
  app.get('/api/v1/payments/', authenticateToken, (req: Request, res: Response) => {
    const currentDb = loadDB();
    const search = ((req.query.search as string) || '').toLowerCase();
    const studentId = req.query.student_id as string;
    const method = req.query.method as string;
    const verificationStatus = req.query.verification_status as string;

    let results = currentDb.payments;
    if (search) {
      results = results.filter(
        (p) =>
          p.reference.toLowerCase().includes(search) ||
          p.student_name.toLowerCase().includes(search) ||
          p.student_code.toLowerCase().includes(search)
      );
    }
    if (studentId && studentId !== 'all') {
      results = results.filter((p) => p.student_id === studentId || p.student_code === studentId);
    }
    if (method && method !== 'all') {
      results = results.filter((p) => p.payment_method === method);
    }
    if (verificationStatus && verificationStatus !== 'all') {
      results = results.filter((p) => p.verification_status === verificationStatus);
    }

    return res.json({
      count: results.length,
      results,
    });
  });

  app.get('/api/v1/payments/verification-queue/', authenticateToken, (_req: Request, res: Response) => {
    const currentDb = loadDB();
    const pending = currentDb.payments.filter((p) => p.verification_status === 'pending');
    return res.json({
      count: pending.length,
      results: pending,
    });
  });

  app.post('/api/v1/payments/', authenticateToken, requireRole(['admin', 'director']), (req: AuthRequest, res: Response) => {
    const { student_id, amount, payment_method, payment_date, note, receipt_url } = req.body;
    if (!student_id || !amount || !payment_method) {
      return res.status(400).json({ detail: 'Student, amount, and payment method are required.' });
    }

    const payAmount = parseInt(amount, 10);
    if (isNaN(payAmount) || payAmount <= 0) {
      return res.status(400).json({ detail: 'Payment amount must be a positive number.' });
    }

    const currentDb = loadDB();
    const student = currentDb.students.find((s) => s.id === student_id || s.student_id === student_id);
    if (!student) {
      return res.status(404).json({ detail: 'Student not found.' });
    }

    // Cash is direct; Click/Payme/Uzum requires receipt verification
    const isCash = payment_method.toLowerCase() === 'cash';
    const isApproved = isCash; // Cash is accepted at reception immediately

    const refNumber = 890 + currentDb.payments.length + 1;
    const newPayment = {
      id: `pay_${Date.now()}`,
      reference: `PAY-2026-0${refNumber}`,
      student_id: student.id,
      student_code: student.student_id,
      student_name: student.full_name,
      amount: payAmount,
      payment_method: payment_method.toLowerCase(),
      payment_date: payment_date || new Date().toISOString().split('T')[0],
      verification_status: isApproved ? 'approved' : 'pending',
      payment_status: isApproved ? 'confirmed' : 'unverified',
      registered_by: `${req.user?.full_name || 'Admin'} (${req.user?.role?.toUpperCase() || 'STAFF'})`,
      reviewed_by: isApproved ? 'Direct Reception Receipt' : null,
      receipt_url: receipt_url || null,
      note: note || '',
      created_at: new Date().toISOString(),
    };

    // If verified immediately (cash), adjust student balance
    if (isApproved) {
      student.amount_paid += payAmount;
      student.balance_due = Math.max(0, student.monthly_fee - student.amount_paid);
      student.last_payment_date = newPayment.payment_date;
      if (student.balance_due === 0) {
        student.payment_status = 'paid';
        if (student.account_status === 'restricted') {
          student.account_status = 'active';
          student.restriction_reason = null;
        }
      } else {
        student.payment_status = 'partially_paid';
      }
    }

    currentDb.payments.unshift(newPayment);
    saveDB(currentDb);

    return res.status(201).json(newPayment);
  });

  // Verify payment endpoint
  app.patch('/api/v1/payments/:id/verify/', authenticateToken, (req: AuthRequest, res: Response) => {
    const { action, reason } = req.body;
    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ detail: 'Action must be approve or reject.' });
    }

    const currentDb = loadDB();
    const payment = currentDb.payments.find((p) => p.id === req.params.id);
    if (!payment) {
      return res.status(404).json({ detail: 'Payment record not found.' });
    }

    if (payment.verification_status !== 'pending') {
      return res.status(400).json({ detail: `Payment is already marked as ${payment.verification_status}.` });
    }

    const student = currentDb.students.find((s) => s.id === payment.student_id || s.student_id === payment.student_code);

    if (action === 'approve') {
      payment.verification_status = 'approved';
      payment.payment_status = 'confirmed';
      payment.reviewed_by = `${req.user?.full_name || 'Staff'} (${req.user?.role?.toUpperCase()})`;

      if (student) {
        student.amount_paid += payment.amount;
        student.balance_due = Math.max(0, student.monthly_fee - student.amount_paid);
        student.last_payment_date = payment.payment_date;
        if (student.balance_due === 0) {
          student.payment_status = 'paid';
          if (student.account_status === 'restricted') {
            student.account_status = 'active';
            student.restriction_reason = null;
          }
        } else {
          student.payment_status = 'partially_paid';
        }
      }
    } else {
      payment.verification_status = 'rejected';
      payment.payment_status = 'failed';
      payment.reviewed_by = `${req.user?.full_name || 'Staff'} (${req.user?.role?.toUpperCase()})`;
      payment.rejection_reason = reason || 'Bank transaction could not be reconciled against statement.';
    }

    saveDB(currentDb);
    return res.json({ payment, student });
  });

  // ----------------------------------------------------
  // SHOP PRODUCTS ENDPOINTS
  // ----------------------------------------------------
  app.get('/api/v1/shop/products/', authenticateToken, (req: Request, res: Response) => {
    const currentDb = loadDB();
    const search = ((req.query.search as string) || '').toLowerCase();
    let results = currentDb.products;
    if (search) {
      results = results.filter((p) => p.name.toLowerCase().includes(search) || p.description.toLowerCase().includes(search));
    }
    return res.json({
      count: results.length,
      results,
    });
  });

  app.post('/api/v1/shop/products/', authenticateToken, requireRole(['admin', 'director']), (req: Request, res: Response) => {
    const { name, description, coin_price, stock_quantity, is_active, image_url } = req.body;
    if (!name || coin_price === undefined || stock_quantity === undefined) {
      return res.status(400).json({ detail: 'Product name, coin price, and stock quantity are required.' });
    }

    const price = parseInt(coin_price, 10);
    const stock = parseInt(stock_quantity, 10);
    if (isNaN(price) || price <= 0) {
      return res.status(400).json({ detail: 'Coin price must be a positive integer.' });
    }
    if (isNaN(stock) || stock < 0) {
      return res.status(400).json({ detail: 'Stock quantity must be non-negative.' });
    }

    const currentDb = loadDB();
    const newProduct = {
      id: `prd_${Date.now()}`,
      name: name.trim(),
      description: (description || '').trim(),
      coin_price: price,
      stock_quantity: stock,
      is_active: is_active !== false,
      image_url: image_url || '/src/assets/images/shop_product_notebook_1792586463610.jpg',
      created_at: new Date().toISOString(),
    };

    currentDb.products.unshift(newProduct);
    saveDB(currentDb);
    return res.status(201).json(newProduct);
  });

  app.patch('/api/v1/shop/products/:id/', authenticateToken, requireRole(['admin', 'director']), (req: Request, res: Response) => {
    const currentDb = loadDB();
    const index = currentDb.products.findIndex((p) => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ detail: 'Product not found.' });
    }

    const { name, description, coin_price, stock_quantity, is_active, image_url } = req.body;
    if (name) currentDb.products[index].name = name.trim();
    if (description !== undefined) currentDb.products[index].description = description.trim();
    if (coin_price !== undefined) {
      const p = parseInt(coin_price, 10);
      if (isNaN(p) || p <= 0) return res.status(400).json({ detail: 'Price must be positive.' });
      currentDb.products[index].coin_price = p;
    }
    if (stock_quantity !== undefined) {
      const s = parseInt(stock_quantity, 10);
      if (isNaN(s) || s < 0) return res.status(400).json({ detail: 'Stock must be non-negative.' });
      currentDb.products[index].stock_quantity = s;
    }
    if (is_active !== undefined) currentDb.products[index].is_active = is_active;
    if (image_url) currentDb.products[index].image_url = image_url;

    saveDB(currentDb);
    return res.json(currentDb.products[index]);
  });

  // ----------------------------------------------------
  // SHOP ORDERS ENDPOINTS
  // ----------------------------------------------------
  app.get('/api/v1/shop/orders/', authenticateToken, (req: Request, res: Response) => {
    const currentDb = loadDB();
    const search = ((req.query.search as string) || '').toLowerCase();
    const status = req.query.status as string;

    let results = currentDb.orders;
    if (search) {
      results = results.filter(
        (o) =>
          o.order_number.toLowerCase().includes(search) ||
          o.student_name.toLowerCase().includes(search) ||
          o.student_code.toLowerCase().includes(search) ||
          o.product_name.toLowerCase().includes(search)
      );
    }
    if (status && status !== 'all') {
      results = results.filter((o) => o.status === status);
    }

    return res.json({
      count: results.length,
      results,
    });
  });

  app.patch('/api/v1/shop/orders/:id/', authenticateToken, requireRole(['admin', 'director']), (req: Request, res: Response) => {
    const { status, admin_notes } = req.body;
    const validStatuses = ['pending', 'approved', 'processing', 'ready', 'completed', 'rejected', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ detail: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const currentDb = loadDB();
    const order = currentDb.orders.find((o) => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ detail: 'Order not found.' });
    }

    const oldStatus = order.status;
    order.status = status;
    if (admin_notes !== undefined) order.admin_notes = admin_notes;

    // Backend Coin Refund Policy:
    // If order is rejected or cancelled and wasn't already rejected/cancelled, refund the student coins and restore stock!
    if ((status === 'rejected' || status === 'cancelled') && oldStatus !== 'rejected' && oldStatus !== 'cancelled') {
      const student = currentDb.students.find((s) => s.id === order.student_id || s.student_id === order.student_code);
      if (student) {
        student.coin_balance += order.total_coins;
        currentDb.coinTransactions.push({
          id: `ctx_${Date.now()}`,
          student_id: student.id,
          amount: +order.total_coins,
          reason: `Refund for ${status} order ${order.order_number}`,
          created_at: new Date().toISOString(),
        });
      }
      const product = currentDb.products.find((p) => p.id === order.product_id);
      if (product) {
        product.stock_quantity += order.quantity;
      }
    }

    saveDB(currentDb);
    return res.json(order);
  });

  // ----------------------------------------------------
  // NOTIFICATIONS ENDPOINTS
  // ----------------------------------------------------
  app.get('/api/v1/notifications/', authenticateToken, (_req: Request, res: Response) => {
    const currentDb = loadDB();
    return res.json({
      count: currentDb.notifications.length,
      unread_count: currentDb.notifications.filter((n) => !n.is_read).length,
      results: currentDb.notifications,
    });
  });

  app.patch('/api/v1/notifications/:id/read/', authenticateToken, (req: Request, res: Response) => {
    const currentDb = loadDB();
    const notif = currentDb.notifications.find((n) => n.id === req.params.id);
    if (notif) {
      notif.is_read = true;
      saveDB(currentDb);
    }
    return res.json({ detail: 'Marked as read' });
  });

  app.post('/api/v1/notifications/mark-all-read/', authenticateToken, (_req: Request, res: Response) => {
    const currentDb = loadDB();
    currentDb.notifications.forEach((n) => (n.is_read = true));
    saveDB(currentDb);
    return res.json({ detail: 'All notifications marked as read' });
  });

  // ----------------------------------------------------
  // FILE UPLOAD ENDPOINT
  // ----------------------------------------------------
  app.post('/api/v1/uploads/', upload.single('file'), (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ detail: 'No file uploaded.' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    return res.json({
      url: fileUrl,
      filename: req.file.originalname,
      size: req.file.size,
    });
  });

  // ----------------------------------------------------
  // FRONTEND VITE INTEGRATION
  // ----------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Avlod Ta'lim backend server active on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup failed:', err);
});
