import { ENUMS } from "@enums/index";

export const errorResponseSchema = (message: string) => ({
  type: ENUMS.Common.DataTypes.OBJECT,
  properties: {
    error: { type: ENUMS.Common.DataTypes.STRING },
    message: { type: ENUMS.Common.DataTypes.STRING, example: message },
  },
});
