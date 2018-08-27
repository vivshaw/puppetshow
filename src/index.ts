#!/usr/bin/env node

import chalk from 'chalk';
import program from 'commander';
import 'reflect-metadata';

import { context } from './inversify.config';
import { Renderer } from './renderer/renderer';
import { IOptions } from './types';

interface IArgsType {
  workingdir?: string;
  port?: number;
  dist?: string;
}

async function render(args: IArgsType) {
  const DEFAULT_PORT = 4321;

  const options: IOptions = {
    port: args.port || DEFAULT_PORT,
    host: `http://localhost:${args.port || DEFAULT_PORT}`,
    pathParams: {
      workingDir: args.workingdir || process.cwd(),
      distSubDir: args.dist || 'dist',
    },
    verbose: true,
  };

  const ctx = context(options);
  await ctx.ready();

  const renderer = ctx.get<Renderer>(Renderer);

  // Run the prerender loop that crawls the page & spits out HTML snapshots
  await renderer.run();

  // Clean up Puppeteer & Express processes
  ctx.close();
}

const marotte = program.version('0.0.4');

marotte
  .command('render')
  .alias('r')
  .description('Statically prerender the application')
  .option('-w, --workingdir [dir]', 'Working directory for project [processs.cwd()]')
  .option('-d, --dist [dir]', 'Distribution subdirectory for project [./dist]')
  .option('-p, --port [port]', 'Port to host Express on [4000]')
  .action((args: IArgsType) => {
    render(args)
      .then(() => console.log(chalk.bold.white('Static prerendering complete!')))
      .catch(err => {
        console.error('Err', err);
        process.exit(1);
      });
  });

marotte.parse(process.argv);

if (marotte.args.length === 0) {
  marotte.help();
}
