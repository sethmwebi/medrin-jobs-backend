import { cleanEnv, port, str } from "envalid";

export default cleanEnv(process.env, {
  PORT: port(),
  MONGO_DATABASE_URI: str(),
  MONGO_PROJECT_ID: str(),
  MONGO_CLUSTER: str(),
  MONGO_PUBLIC_KEY: str(),
  MONGO_PRIVATE_KEY: str(),

});