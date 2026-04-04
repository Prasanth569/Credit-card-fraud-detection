export const Common = {
  DataTypes: {
    OBJECT: "object",
    STRING: "string",
    NUMBER: "number",
    BOOLEAN: "boolean",
    ARRAY: "array",
    NULL: "null",
  },
  ActiveStatus: {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",
  },
  Gender: {
    MALE: "MALE",
    FEMALE: "FEMALE",
    OTHER: "OTHER",
  },
  Decision: {
    ALLOW: "ALLOW",
    FLAG: "FLAG",
    BLOCK: "BLOCK",
  },
  ErrorMessages: {
    INTERNAL_SERVER_ERROR: "Internal Server Error",
    BAD_REQUEST: "Bad Request",
    NOT_FOUND: "Not Found",
  },
  Status: {
    SUCCESS: "SUCCESS",
    FAILED: "FAILED",
  },
} as const;
