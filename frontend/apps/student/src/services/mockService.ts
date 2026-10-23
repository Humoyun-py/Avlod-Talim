import {
  INITIAL_COURSES,
  INITIAL_GROUPS,
  INITIAL_ORDERS,
  INITIAL_PAYMENTS,
  INITIAL_PRODUCTS,
  INITIAL_SETTINGS,
  INITIAL_STUDENTS,
  INITIAL_TEACHERS,
  INITIAL_TEACHER_SALARIES
} from '../data/mockData';
import {
  CoinTransaction,
  Course,
  DirectorSettings,
  Group,
  Payment,
  PaymentMethod,
  PaymentStatus,
  Product,
  ShopOrder,
  Student,
  Teacher,
  TeacherSalaryRecord
} from '../types';

const STORAGE_KEYS = {
  TEACHERS: 'avlod_director_teachers_v1',
  STUDENTS: 'avlod_director_students_v1',
  GROUPS: 'avlod_director_groups_v1',
  COURSES: 'avlod_director_courses_v1',
  PAYMENTS: 'avlod_director_payments_v1',
  SALARIES: 'avlod_director_salaries_v1',
  PRODUCTS: 'avlod_director_products_v1',
  ORDERS: 'avlod_director_orders_v1',
  SETTINGS: 'avlod_director_settings_v1',
  COIN_TRANSACTIONS: 'avlod_director_coin_tx_v1',
  TEACHER_PASSWORDS: 'avlod_director_teacher_passwords_v1'
};

function getStored<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('LocalStorage write failed:', err);
    throw new Error('Maʼlumotlarni brauzer xotirasiga (localStorage) yozishda xatolik yuz berdi');
  }
}

export const DirectorService = {
  // Teachers
  async getTeachers(): Promise<Teacher[]> {
    return getStored<Teacher[]>(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS);
  },

  async getTeacherPassword(identifier: string): Promise<string> {
    const passwords = getStored<Record<string, string>>(STORAGE_KEYS.TEACHER_PASSWORDS, {
      'sardor_react': 'teacher123',
      'madina_python': 'teacher123',
      'jahongir_dev': 'teacher123',
      'hilola_qa': 'teacher123',
      'bobur_flutter': 'teacher123',
      'shaxzod_ui': 'teacher123',
      'nodira_data': 'teacher123',
      'jasur_java': 'teacher123',
      't-1': 'teacher123',
      't-2': 'teacher123',
      't-3': 'teacher123'
    });
    return passwords[identifier] || passwords[identifier.toLowerCase()] || 'teacher123';
  },

  async createTeacher(data: Omit<Teacher, 'id' | 'createdAt' | 'groupsCount' | 'studentsCount' | 'attendanceRate' | 'monthlySalary'> & { password?: string }): Promise<Teacher> {
    const teachers = await this.getTeachers();
    const newId = `t-${Date.now()}`;
    const plainPassword = data.password || 'teacher123';
    const newTeacher: Teacher = {
      ...data,
      id: newId,
      password: plainPassword,
      createdAt: new Date().toISOString().split('T')[0],
      groupsCount: 0,
      studentsCount: 0,
      attendanceRate: 100,
      monthlySalary: 0
    };
    teachers.unshift(newTeacher);
    setStored(STORAGE_KEYS.TEACHERS, teachers);

    // Store teacher password
    const passwords = getStored<Record<string, string>>(STORAGE_KEYS.TEACHER_PASSWORDS, {});
    passwords[newId] = plainPassword;
    passwords[data.username.toLowerCase()] = plainPassword;
    setStored(STORAGE_KEYS.TEACHER_PASSWORDS, passwords);

    window.dispatchEvent(new CustomEvent('teachers-updated'));
    return newTeacher;
  },

  async updateTeacher(id: string, updates: Partial<Teacher> & { password?: string }): Promise<Teacher> {
    const teachers = await this.getTeachers();
    const index = teachers.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Ustoz topilmadi');
    
    if (updates.password) {
      const passwords = getStored<Record<string, string>>(STORAGE_KEYS.TEACHER_PASSWORDS, {});
      passwords[id] = updates.password;
      passwords[teachers[index].username.toLowerCase()] = updates.password;
      if (updates.username) {
        passwords[updates.username.toLowerCase()] = updates.password;
      }
      setStored(STORAGE_KEYS.TEACHER_PASSWORDS, passwords);
    }

    teachers[index] = { ...teachers[index], ...updates };
    setStored(STORAGE_KEYS.TEACHERS, teachers);

    // If teacher name updated, sync to groups and students
    if (updates.fullName || updates.firstName || updates.lastName) {
      const groups = await this.getGroups();
      const newName = updates.fullName || `${updates.firstName || teachers[index].firstName} ${updates.lastName || teachers[index].lastName}`;
      let groupsChanged = false;
      groups.forEach(g => {
        if (g.teacherId === id) {
          g.teacherName = newName;
          groupsChanged = true;
        }
      });
      if (groupsChanged) {
        setStored(STORAGE_KEYS.GROUPS, groups);
      }
    }

    window.dispatchEvent(new CustomEvent('teachers-updated'));
    return teachers[index];
  },

  async deleteTeacher(id: string): Promise<void> {
    const teachers = await this.getTeachers();
    const filtered = teachers.filter(t => t.id !== id);
    setStored(STORAGE_KEYS.TEACHERS, filtered);
    window.dispatchEvent(new CustomEvent('teachers-updated'));
  },

  // Students
  async getStudents(): Promise<Student[]> {
    return getStored<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
  },

  async createStudent(payload: {
    firstName: string;
    lastName: string;
    phone: string;
    courseId?: string;
    courseName?: string;
    groupId?: string;
    groupName?: string;
    teacherName?: string;
    monthlyPayment: number;
    avatarUrl?: string;
  }): Promise<{ student: Student; generatedId: string; generatedPassword: string }> {
    const students = await this.getStudents();
    
    // Generate unique 8 digit ID
    const existingIds = new Set(students.map(s => s.studentId));
    let random8 = '';
    do {
      random8 = Math.floor(10000000 + Math.random() * 90000000).toString();
    } while (existingIds.has(random8));

    // Generate 6 alphanumeric secure password with letters and numbers
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let tempPass = '';
    for (let i = 0; i < 6; i++) {
      tempPass += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const newStudent: Student = {
      id: `s-${Date.now()}`,
      studentId: random8,
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      fullName: `${payload.firstName.trim()} ${payload.lastName.trim()}`,
      phone: payload.phone.trim(),
      courseId: payload.courseId || '',
      courseName: payload.courseName || 'Kurs biriktirilmagan',
      groupId: payload.groupId || '',
      groupName: payload.groupName || 'Guruhsiz (Bosh)',
      teacherName: payload.teacherName || 'Ustoz biriktirilmagan',
      avatarUrl: payload.avatarUrl,
      monthlyPayment: Number(payload.monthlyPayment) || 0,
      paymentStatus: 'pending',
      attendanceRate: 100,
      coins: 0,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0]
    };

    students.unshift(newStudent);
    setStored(STORAGE_KEYS.STUDENTS, students);

    // Sync group studentsCount
    if (payload.groupId) {
      const groups = await this.getGroups();
      const gIdx = groups.findIndex(g => g.id === payload.groupId);
      if (gIdx !== -1) {
        groups[gIdx].studentsCount = (groups[gIdx].studentsCount || 0) + 1;
        setStored(STORAGE_KEYS.GROUPS, groups);
      }
    }

    return {
      student: newStudent,
      generatedId: random8,
      generatedPassword: tempPass
    };
  },

  async updateStudent(id: string, updates: Partial<Student>): Promise<Student> {
    const students = await this.getStudents();
    const index = students.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Talaba topilmadi');

    const oldGroupId = students[index].groupId;
    const newGroupId = updates.groupId;

    students[index] = { ...students[index], ...updates };
    setStored(STORAGE_KEYS.STUDENTS, students);

    // Sync group counts if group changed
    if (newGroupId !== undefined && newGroupId !== oldGroupId) {
      const groups = await this.getGroups();
      let changed = false;
      if (oldGroupId) {
        const oldGrp = groups.find(g => g.id === oldGroupId);
        if (oldGrp && oldGrp.studentsCount > 0) {
          oldGrp.studentsCount -= 1;
          changed = true;
        }
      }
      if (newGroupId) {
        const newGrp = groups.find(g => g.id === newGroupId);
        if (newGrp) {
          newGrp.studentsCount = (newGrp.studentsCount || 0) + 1;
          changed = true;
        }
      }
      if (changed) {
        setStored(STORAGE_KEYS.GROUPS, groups);
      }
    }

    return students[index];
  },

  async deleteStudent(id: string): Promise<void> {
    const students = await this.getStudents();
    const studentToDelete = students.find(s => s.id === id);
    const filtered = students.filter(s => s.id !== id);
    setStored(STORAGE_KEYS.STUDENTS, filtered);

    // Decrement group count
    if (studentToDelete?.groupId) {
      const groups = await this.getGroups();
      const grp = groups.find(g => g.id === studentToDelete.groupId);
      if (grp && grp.studentsCount > 0) {
        grp.studentsCount -= 1;
        setStored(STORAGE_KEYS.GROUPS, groups);
      }
    }
  },

  async getCoinTransactions(): Promise<CoinTransaction[]> {
    return getStored<CoinTransaction[]>(STORAGE_KEYS.COIN_TRANSACTIONS, [
      {
        id: 'ctx-1',
        studentId: 's-2',
        studentPublicId: '82940173',
        studentName: 'Shahzoda Ergasheva',
        groupName: 'FE-14 (React Pro)',
        amount: 50,
        operation: 'add',
        previousBalance: 570,
        newBalance: 620,
        reason: 'Darsdagi faollik uchun',
        date: '2026-02-28 14:30'
      },
      {
        id: 'ctx-2',
        studentId: 's-5',
        studentPublicId: '47201938',
        studentName: 'Gulsanam Nazarova',
        groupName: 'BE-08 (Django Elite)',
        amount: 100,
        operation: 'add',
        previousBalance: 430,
        newBalance: 530,
        reason: 'Uy vazifasini a\'lo bahoga bajargani uchun',
        date: '2026-02-27 18:15'
      },
      {
        id: 'ctx-3',
        studentId: 's-6',
        studentPublicId: '68301924',
        studentName: 'Muzaffar Xoliqov',
        groupName: 'BE-08 (Django Elite)',
        amount: 50,
        operation: 'add',
        previousBalance: 290,
        newBalance: 340,
        reason: 'Direktor maxsus mukofoti',
        date: '2026-02-26 11:00'
      }
    ]);
  },

  async awardStudentCoins(
    studentId: string,
    amount: number,
    operation: 'add' | 'subtract' | 'set' = 'add',
    reason?: string
  ): Promise<{ student: Student; newTotal: number }> {
    const students = await this.getStudents();
    const index = students.findIndex(s => s.id === studentId || s.studentId === studentId);
    if (index === -1) throw new Error('O‘quvchi topilmadi');

    const targetStudent = students[index];
    const currentCoins = Number(targetStudent.coins || 0);
    let newTotal = currentCoins;
    if (operation === 'add') {
      newTotal = currentCoins + amount;
    } else if (operation === 'subtract') {
      newTotal = Math.max(0, currentCoins - amount);
    } else if (operation === 'set') {
      newTotal = Math.max(0, amount);
    }

    targetStudent.coins = newTotal;
    setStored(STORAGE_KEYS.STUDENTS, students);

    // Record transaction
    const now = new Date();
    const dateFormatted = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const tx: CoinTransaction = {
      id: `ctx-${Date.now()}`,
      studentId: targetStudent.id,
      studentPublicId: targetStudent.studentId,
      studentName: targetStudent.fullName,
      groupName: targetStudent.groupName,
      amount,
      operation,
      previousBalance: currentCoins,
      newBalance: newTotal,
      reason: reason || 'Direktor tomonidan berildi',
      date: dateFormatted
    };

    const currentTxs = await this.getCoinTransactions();
    currentTxs.unshift(tx);
    setStored(STORAGE_KEYS.COIN_TRANSACTIONS, currentTxs);

    // Notify listeners
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('students-updated'));
      window.dispatchEvent(new CustomEvent('coin-transactions-updated'));
    }

    return { student: targetStudent, newTotal };
  },

  // Groups
  async getGroups(): Promise<Group[]> {
    return getStored<Group[]>(STORAGE_KEYS.GROUPS, INITIAL_GROUPS);
  },

  async createGroup(data: Omit<Group, 'id' | 'studentsCount'> & { selectedStudentIds?: string[] }): Promise<Group> {
    const groups = await this.getGroups();
    const newGroupId = `g-${Date.now()}`;
    const selectedIds = data.selectedStudentIds || data.studentIds || [];

    const newGroup: Group = {
      ...data,
      id: newGroupId,
      studentIds: selectedIds,
      studentsCount: selectedIds.length
    };

    groups.unshift(newGroup);
    setStored(STORAGE_KEYS.GROUPS, groups);

    // Sync students assigned to this new group
    if (selectedIds.length > 0) {
      const students = await this.getStudents();
      let studentsChanged = false;
      students.forEach(st => {
        if (selectedIds.includes(st.id)) {
          st.groupId = newGroupId;
          st.groupName = newGroup.name;
          st.courseId = newGroup.courseId;
          st.courseName = newGroup.courseName;
          st.teacherName = newGroup.teacherName;
          studentsChanged = true;
        }
      });
      if (studentsChanged) {
        setStored(STORAGE_KEYS.STUDENTS, students);
      }
    }

    return newGroup;
  },

  async updateGroup(id: string, updates: Partial<Group> & { selectedStudentIds?: string[] }): Promise<Group> {
    const groups = await this.getGroups();
    const index = groups.findIndex(g => g.id === id);
    if (index === -1) throw new Error('Guruh topilmadi');

    const selectedIds = updates.selectedStudentIds || updates.studentIds;
    const updated: Group = { ...groups[index], ...updates };

    if (selectedIds !== undefined) {
      updated.studentIds = selectedIds;
      updated.studentsCount = selectedIds.length;
    }

    groups[index] = updated;
    setStored(STORAGE_KEYS.GROUPS, groups);

    // Sync student records with updated group info
    const students = await this.getStudents();
    let studentsChanged = false;

    students.forEach(st => {
      // If student was in this group and removed
      if (selectedIds !== undefined) {
        if (st.groupId === id && !selectedIds.includes(st.id)) {
          st.groupId = '';
          st.groupName = 'Guruhsiz (Bosh)';
          studentsChanged = true;
        } else if (selectedIds.includes(st.id) && st.groupId !== id) {
          st.groupId = id;
          st.groupName = updated.name;
          st.courseId = updated.courseId;
          st.courseName = updated.courseName;
          st.teacherName = updated.teacherName;
          studentsChanged = true;
        }
      }
      // If group name or teacher updated
      if (st.groupId === id) {
        if (updates.name && st.groupName !== updates.name) {
          st.groupName = updates.name;
          studentsChanged = true;
        }
        if (updates.teacherName && st.teacherName !== updates.teacherName) {
          st.teacherName = updates.teacherName;
          studentsChanged = true;
        }
        if (updates.courseName && st.courseName !== updates.courseName) {
          st.courseName = updates.courseName;
          studentsChanged = true;
        }
      }
    });

    if (studentsChanged) {
      setStored(STORAGE_KEYS.STUDENTS, students);
    }

    return groups[index];
  },

  async deleteGroup(id: string): Promise<void> {
    const groups = await this.getGroups();
    setStored(STORAGE_KEYS.GROUPS, groups.filter(g => g.id !== id));

    // Unassign all students belonging to this deleted group
    const students = await this.getStudents();
    let studentsChanged = false;
    students.forEach(st => {
      if (st.groupId === id) {
        st.groupId = '';
        st.groupName = 'Guruhsiz (Bosh)';
        studentsChanged = true;
      }
    });
    if (studentsChanged) {
      setStored(STORAGE_KEYS.STUDENTS, students);
    }
  },

  // Courses
  async getCourses(): Promise<Course[]> {
    return getStored<Course[]>(STORAGE_KEYS.COURSES, INITIAL_COURSES);
  },

  async createCourse(data: Omit<Course, 'id' | 'studentsCount' | 'groupsCount'>): Promise<Course> {
    const courses = await this.getCourses();
    const newCourse: Course = {
      ...data,
      id: `c-${Date.now()}`,
      studentsCount: 0,
      groupsCount: 0
    };
    courses.unshift(newCourse);
    setStored(STORAGE_KEYS.COURSES, courses);
    return newCourse;
  },

  async updateCourse(id: string, updates: Partial<Course>): Promise<Course> {
    const courses = await this.getCourses();
    const index = courses.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Kurs topilmadi');
    courses[index] = { ...courses[index], ...updates };
    setStored(STORAGE_KEYS.COURSES, courses);
    return courses[index];
  },

  async deleteCourse(id: string): Promise<void> {
    const courses = await this.getCourses();
    setStored(STORAGE_KEYS.COURSES, courses.filter(c => c.id !== id));
  },

  // Payments
  async getPayments(): Promise<Payment[]> {
    return getStored<Payment[]>(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
  },

  async addPayment(data: {
    studentId: string;
    studentPublicId: string;
    studentName: string;
    courseName: string;
    groupName: string;
    amount: number;
    method: PaymentMethod;
    receiptNumber?: string;
    receiptImage?: string;
    note?: string;
  }): Promise<Payment> {
    // 1. Validate positive payment amount
    if (!data.amount || data.amount <= 0) {
      throw new Error('To‘lov summasi 0 dan katta musbat son bo‘lishi lozim');
    }

    // 2. Validate receipt for non-cash payment
    if (data.method !== 'Naqd') {
      if (!data.receiptNumber?.trim() && !data.receiptImage?.trim()) {
        throw new Error('Elektron to‘lovlar (Click, Payme, Uzum) uchun haqiqiy chek raqami yoki rasmi talab etiladi');
      }
    }

    const payments = await this.getPayments();
    const now = new Date();
    const dateFormatted = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      studentId: data.studentId,
      studentPublicId: data.studentPublicId,
      studentName: data.studentName,
      courseName: data.courseName,
      groupName: data.groupName,
      amount: data.amount,
      method: data.method,
      receiptNumber: data.receiptNumber?.trim(),
      receiptImage: data.receiptImage,
      date: dateFormatted,
      status: 'paid',
      note: data.note
    };

    payments.unshift(newPayment);
    setStored(STORAGE_KEYS.PAYMENTS, payments);

    // 3. Mark month paid ONLY when cumulative paid amount for student reaches monthly fee
    const students = await this.getStudents();
    const sIdx = students.findIndex(s => s.id === data.studentId);
    if (sIdx !== -1) {
      const currentStudent = students[sIdx];
      // Sum all recorded payments for this student in current period
      const totalPaid = payments
        .filter(p => p.studentId === data.studentId && p.status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0);

      if (totalPaid >= currentStudent.monthlyPayment) {
        currentStudent.paymentStatus = 'paid';
      } else {
        // Partial payment: status remains pending/overdue until full balance cleared
        currentStudent.paymentStatus = currentStudent.paymentStatus === 'overdue' ? 'overdue' : 'pending';
      }
      setStored(STORAGE_KEYS.STUDENTS, students);
    }

    return newPayment;
  },

  // Teacher Salaries (Calculated dynamically or retrieved)
  async getSalaries(): Promise<TeacherSalaryRecord[]> {
    const storedSalaries = getStored<TeacherSalaryRecord[]>(STORAGE_KEYS.SALARIES, INITIAL_TEACHER_SALARIES);
    return storedSalaries;
  },

  async markSalaryPaid(id: string): Promise<TeacherSalaryRecord> {
    const salaries = await this.getSalaries();
    const index = salaries.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Oylik hisob topilmadi');
    salaries[index].status = 'paid';
    setStored(STORAGE_KEYS.SALARIES, salaries);
    return salaries[index];
  },

  // Shop Products
  async getProducts(): Promise<Product[]> {
    return getStored<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  },

  async createProduct(data: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    const products = await this.getProducts();
    const newProduct: Product = {
      ...data,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    products.unshift(newProduct);
    setStored(STORAGE_KEYS.PRODUCTS, products);
    return newProduct;
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const products = await this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Mahsulot topilmadi');
    products[index] = { ...products[index], ...updates };
    setStored(STORAGE_KEYS.PRODUCTS, products);
    return products[index];
  },

  async deleteProduct(id: string): Promise<void> {
    const products = await this.getProducts();
    setStored(STORAGE_KEYS.PRODUCTS, products.filter(p => p.id !== id));
  },

  // Shop Orders
  async getOrders(): Promise<ShopOrder[]> {
    return getStored<ShopOrder[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
  },

  async updateOrderStatus(id: string, status: ShopOrder['status']): Promise<ShopOrder> {
    const orders = await this.getOrders();
    const index = orders.findIndex(o => o.id === id);
    if (index === -1) throw new Error('Buyurtma topilmadi');
    orders[index].status = status;
    setStored(STORAGE_KEYS.ORDERS, orders);
    return orders[index];
  },

  // Director Settings
  async getSettings(): Promise<DirectorSettings> {
    const settings = getStored<DirectorSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    // Avlod Ta'lim permanent signature color is always #5C42FD (Binafsharang)
    settings.primaryColor = '#5C42FD';
    return settings;
  },

  async updateSettings(updates: Partial<DirectorSettings>): Promise<DirectorSettings> {
    const current = await this.getSettings();
    const updated = { ...current, ...updates, primaryColor: '#5C42FD' };
    setStored(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  }
};
