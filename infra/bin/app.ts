#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib'
import { ApplyTrackStack } from '../lib/stack'

const app = new cdk.App()

new ApplyTrackStack(app, 'ApplyTrackStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
  },
  description: 'ApplyTrack — AI job application tracker',
})
