#!/usr/bin/env node
import "source-map-support/register";
import { IdealOctoWaffleStack } from "../lib/stack";
import config = require("config");
import { App } from "aws-cdk-lib";
import { Tagger } from "./tagger";

const ACCOUNT_NUMBER = config.get<string>("account_number");
const REGION = config.get<string>("region");
const PROJECT_NAME = config.get<string>("project_name");
const COMPONENT_NAME = config.get<string>("component_name");
const ENV = config.get<string>("env");
const OWNER = config.get<string>("owner");

const app = new App();
const stack = new IdealOctoWaffleStack(app, `${PROJECT_NAME}-${ENV}-${COMPONENT_NAME}-stack`, {
  env: { account: ACCOUNT_NUMBER, region: REGION }
});

Tagger.addTags(stack, [
  { key: "env", value: ENV },
  { key: "project", value: PROJECT_NAME },
  { key: "module", value: COMPONENT_NAME },
  { key: "owner", value: OWNER }
]);
