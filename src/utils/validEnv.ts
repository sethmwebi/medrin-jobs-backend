import "dotenv/config";
import { cleanEnv, port, str } from "envalid";

export default cleanEnv(process.env, {
  DATABASE_URL: str(),
  PORT: port(),
  JWT_SECRET: str(),
  NODE_ENV: str(),
  GOOGLE_CLIENT_ID: str(),
  GOOGLE_CLIENT_SECRET: str(),
  GOOGLE_CALLBACK: str(),
});
