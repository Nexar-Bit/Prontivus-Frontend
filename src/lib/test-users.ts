/**
 * Test Users for Development
 * Only used in development mode for quick testing
 */

export interface TestUser {
  id: number;
  username: string;
  password: string;
  role_name: string;
  email?: string;
}

/**
 * Test users for each role
 * These are development-only test accounts
 */
export const TEST_USERS: Record<string, TestUser> = {
  SuperAdmin: {
    id: 1,
    username: "superadmin",
    password: "admin123",
    role_name: "SuperAdmin",
    email: "superadmin@test.com",
  },
  AdminClinica: {
    id: 2,
    username: "admin",
    password: "admin123",
    role_name: "AdminClinica",
    email: "admin@test.com",
  },
  Medico: {
    id: 3,
    username: "medico",
    password: "medico123",
    role_name: "Medico",
    email: "medico@test.com",
  },
  Secretaria: {
    id: 4,
    username: "secretaria",
    password: "secretaria123",
    role_name: "Secretaria",
    email: "secretaria@test.com",
  },
  Paciente: {
    id: 5,
    username: "paciente",
    password: "paciente123",
    role_name: "Paciente",
    email: "paciente@test.com",
  },
};

/**
 * Get test user by role name
 */
export function getTestUser(roleName: string): TestUser | null {
  return TEST_USERS[roleName] || null;
}

/**
 * Get all test user role names
 */
export function getTestUserRoles(): string[] {
  return Object.keys(TEST_USERS);
}


