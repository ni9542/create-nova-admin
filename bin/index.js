#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import download from 'download-git-repo';
import ora from 'ora';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';

const program = new Command();

program
    .version('1.0.0')
    .arguments('[project-name]')
    .description('创建一个新的 Nova Admin 后台管理项目')
    .action(async (projectName) => {

        // 1. 收集用户输入与选择
        const prompts = [];

        if (!projectName) {
            prompts.push({
                type: 'input',
                name: 'name',
                message: '✨ 请输入你的后台项目名称:',
                default: 'nova-admin-app',
            });
        }

        // 预留多模版选择，让脚手架显得更专业，默认直接选中你的黄金技术栈
        prompts.push({
            type: 'list',
            name: 'template',
            message: '🛠️ 请选择你要使用的后台模版预设:',
            choices: [
                {
                    name: `${chalk.green('Element Plus')} + ${chalk.blue('TypeScript')} + Pinia (推荐)`,
                    value: 'element-plus-ts'
                },
                // 💡 以后如果想扩展其他技术栈，直接在这里取消注释并加分支即可：
                // { name: 'Ant Design Vue + TS', value: 'ant-design-ts' }
            ]
        });

        const answers = await inquirer.prompt(prompts);
        projectName = projectName || answers.name;

        const targetDir = path.join(process.cwd(), projectName);

        // 2. 检查当前目录下是否已有同名文件夹
        if (fs.existsSync(targetDir)) {
            console.log(chalk.red(`\n❌ 错误：目录 "${projectName}" 已存在，请换个名字或先手动删除它。`));
            return;
        }

        console.log(chalk.blue(`\n🚀 开始构建你的 Nova Admin...`));
        console.log(chalk.gray(`技术栈配置: Vue3, Element Plus, TypeScript, Pinia, Vue Router\n`));

        // 3. 配置你的 Git 仓库地址
        // 💡 请替换为你真正的 vue-admin 模版 Git 地址（建议直接用 https 链接）
        // 格式: 'direct:https://xxx.git#分支名'
        let templateRepo = 'direct:https://github.com';

        // 如果以后有其他分支，可以根据用户选择切换地址：
        // if (answers.template === 'ant-design-ts') { templateRepo = '...' }

        const spinner = ora('正在从云端拉取最新 Nova Admin 模版...').start();

        download(templateRepo, targetDir, { clone: true }, (err) => {
            if (err) {
                spinner.fail(chalk.red('下载模版失败！'));
                console.error(err);
                return;
            }

            spinner.succeed(chalk.green('模版下载成功！'));

            // 4. 自动修改新项目里 package.json 的 name 字段
            const pkgPath = path.join(targetDir, 'package.json');
            if (fs.existsSync(pkgPath)) {
                const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
                pkg.name = projectName;
                fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf-8');
            }

            // 5. 打印大功告成的引导话术
            console.log('\n' + chalk.bold.green(`🎉 恭喜！你的 Nova Admin (Element Plus + TS) 项目已初始化完成！`));
            console.log(`\n请依次执行以下命令启动项目：\n`);
            console.log(chalk.cyan(`  cd ${projectName}`));
            console.log(chalk.cyan(`  npm install`));
            console.log(chalk.cyan(`  npm run dev\n`));
        });
    });

program.parse(process.argv);
