import { gql } from "@apollo/client";

export const LOGIN = gql`
  mutation Login($staffUsername: String!, $staffPassword: String!) {
    login(staffUsername: $staffUsername, staffPassword: $staffPassword) {
      success
      access_token
      role
      staff {
        staffId
        staffUsername
        department {
          departmentId
          departmentName
          prefix
        }
        role {
          roleId
          roleName
        }
      }
    }
  }
`;