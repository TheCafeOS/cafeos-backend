import { schemas } from "./schemas.js";
import { responses } from "./responses.js";

export const components = {
  schemas: {
    ...schemas,
    ...responses,
  },
};