import * as config from "config";
const LAMBDA_ROOT_DIR = config.get<string>("lambda_root_dir");
const LAMBDA_SRC_DIR = config.get<string>("lambda_src_dir");

export { LAMBDA_ROOT_DIR, LAMBDA_SRC_DIR };
