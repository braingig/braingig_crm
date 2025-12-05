import { gql } from '@apollo/client';

export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(input: { email: $email, password: $password }) {
      accessToken
      refreshToken
      user {
        id
        name
        email
        role
        department
      }
    }
  }
`;

export const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      accessToken
      refreshToken
      user {
        id
        name
        email
        role
        department
        phone
        skills
        salaryType
        salaryAmount
        status
      }
    }
  }
`;

export const GET_ME = gql`
  query GetMe {
    me {
      id
      name
      email
      role
      phone
      department
      skills
      salaryType
      salaryAmount
      status
      lastActive
    }
  }
`;

export const GET_USERS = gql`
  query GetUsers($filters: UserFiltersInput) {
    users(filters: $filters) {
      id
      name
      email
      role
      department
      status
      lastActive
    }
  }
`;

export const GET_PROJECTS = gql`
  query GetProjects($filters: ProjectFiltersInput) {
    projects(filters: $filters) {
      id
      name
      description
      budget
      status
      startDate
      endDate
      clientName
      createdBy {
        id
        name
      }
      createdAt
    }
  }
`;

export const CREATE_PROJECT = gql`
  mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) {
      id
      name
      budget
      status
    }
  }
`;

export const GET_TASKS = gql`
  query GetTasks($filters: TaskFiltersInput) {
    tasks(filters: $filters) {
      id
      title
      description
      status
      priority
      projectId
      assignedToId
      dueDate
      timeSpent
      createdAt
    }
  }
`;

export const CREATE_TASK = gql`
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(input: $input) {
      id
      title
      status
      priority
    }
  }
`;

export const CHECK_IN = gql`
  mutation CheckIn {
    checkIn {
      id
      checkIn
      date
    }
  }
`;

export const CHECK_OUT = gql`
  mutation CheckOut {
    checkOut {
      id
      checkOut
      totalHours
    }
  }
`;

export const START_TIME_ENTRY = gql`
  mutation StartTimeEntry($input: StartTimeEntryInput!) {
    startTimeEntry(input: $input) {
      id
      startTime
      taskId
    }
  }
`;

export const STOP_TIME_ENTRY = gql`
  mutation StopTimeEntry {
    stopTimeEntry {
      id
      endTime
      duration
    }
  }
`;

export const GET_ACTIVE_TIME_ENTRY = gql`
  query GetActiveTimeEntry {
    activeTimeEntry {
      id
      startTime
      taskId
      description
    }
  }
`;

export const GET_TODAY_TIMESHEET = gql`
  query GetTodayTimesheet {
    todayTimesheet {
      id
      checkIn
      checkOut
      totalHours
      status
    }
  }
`;

export const UPDATE_USER = gql`
  mutation UpdateUser($id: String!, $input: UpdateUserInput!) {
    updateUser(id: $id, input: $input) {
      id
      name
      email
      role
      phone
      department
      skills
      salaryType
      salaryAmount
      status
    }
  }
`;

export const DELETE_USER = gql`
  mutation DeleteUser($id: String!) {
    deleteUser(id: $id)
  }
`;
