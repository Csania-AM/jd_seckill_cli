const puppeteer = require("puppeteer");
const userAgent = require("./utils/user_agents");
const { addCookies } = require("./utils/util");
const chalk = require("chalk");
const jd_buy = async (config) => {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: false,
            args: [
                "--disable-gpu",
                "--disable-dev-shm-usage",
                "--disable-setuid-sandbox",
                "--no-first-run",
                "--no-sandbox",
                "--no-zygote",
                // "--single-process",
                "--start-maximized",
                "--use-gl=swiftshader",
                "--disable-gl-drawing-for-tests",
            ],
            ignoreDefaultArgs: ["--enable-automation"],
        });
        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(5 * 1000);
        await page.setRequestInterception(true);
        page.on("request", async (req) => {
            // 根据请求类型过滤
            const resourceType = req.resourceType();
            if (resourceType === "image") {
                req.abort();
            } else {
                req.continue();
            }
        });

        await Promise.all(
            addCookies(config.cookie, ".jd.com").map((pair) => {
                return page.setCookie(pair);
            })
        );

        await Promise.all([
            page.setUserAgent(userAgent.random()),
            page.setJavaScriptEnabled(true), //  允许执行 js 脚本
        ]);
        console.log(chalk.green(`开始访问商品页面---------`));
        await page.goto(config.item_url, { waitUntil: "domcontentloaded" });
        console.log(chalk.green(`开始访问商品页面成功---------`));
        let itemName = await page.$eval("body > div:nth-child(10) > div > div.itemInfo-wrap > div.sku-name", (el) => el.innerText);
        // 数量变为2
        await page.waitForFunction(() => {
            document.querySelector("#buy-num").value = config.qinggou_num;
            return true;
        });
        // 抢购
        await qianggou(page);
        console.log(chalk.green(`开始寻找按钮点击`));
        async function qianggou(page) {
            let searchQianggou = await page.$eval("#btn-reservation", (el) => el.innerText);
            // let searchQianggou = await page.$eval(
            //     "#InitCartUrl",
            //     (el) => el.innerText
            // );
            if (searchQianggou.indexOf("加入") >= 0) {
                console.log(chalk.green(`寻找到了，开始抢购`));
                // await Promise.all([
                //     page.waitForNavigation(),
                //     page.click("#InitCartUrl"),
                // ]);
                await Promise.all([page.waitForNavigation(), page.click("#btn-reservation")]);
                let addQianggouSuccess = await page.$eval("#result > div > div > div.success-lcol > div.success-top > h3", (el) => el.innerText);
                if (addQianggouSuccess.indexOf("商品已成功加入购物车") >= 0) {
                    console.log(chalk.green(`${itemName}加入购物车成功`));

                    await page.goto("https://trade.jd.com/shopping/order/getOrderInfo.action");
                    const mima = config.password;
                    // 填入密码。提交订单
                    await page.waitForFunction(
                        (mima) => {
                            document.querySelector(".quark-pw-result-input").value = mima;
                            const inputEvent = new Event("input");
                            document.querySelector(".quark-pw-result-input").dispatchEvent(inputEvent);
                            return true;
                        },
                        {},
                        mima
                    );
                    await Promise.all([page.waitForNavigation(), page.click("#order-submit")]);
                    try {
                        let addDingdanSuccess = await page.$eval(
                            "#indexBlurId > div > div.page-inner-wrap > div.index-content > div > div:nth-child(1) > div.order-info.float-clear > div.float-left.order-info-left.float-clear > div.float-left.order-info-left-detail > div.order-info-left-detail-item-title",
                            (el) => el.innerText
                        );
                        if (addDingdanSuccess.indexOf("订单提交成功") >= 0) {
                            console.log(chalk.green(`${addDingdanSuccess}`));
                        } else {
                            console.log(chalk.red(`订单提交失败`));
                        }
                    } catch (error) {
                        console.log(chalk.red(`----抢购商品没了。----`));
                    }
                } else {
                    console.log(chalk.red(`${itemName}加入购物车失败`));
                }
            } else {
                // 抢购
                console.log(chalk.red(`正在尝试寻找按钮点击`));

                console.log(chalk.green(`尝试刷新商品页面---------`));
                page.setUserAgent(userAgent.random());
                try {
                    await page.goto(config.item_url, {
                        waitUntil: "domcontentloaded",
                    });
                } catch (error) {
                    console.log(chalk.green(`尝试刷新商品页面失败---------`));
                    await page.goto(config.item_url, {
                        waitUntil: "domcontentloaded",
                    });
                }
                await page.type("#buy-num", "2");
                console.log(chalk.green(`尝试刷新商品页面成功---------`));

                await qianggou(page);
            }
        }
    } catch (error) {
        console.log(error);
        console.log(chalk.red(`订单提交失败`));
        await browser.close();
    }
};

const jd_yuyue = async (config) => {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: [
                "--disable-gpu",
                "--disable-dev-shm-usage",
                "--disable-setuid-sandbox",
                "--no-first-run",
                "--no-sandbox",
                "--no-zygote",
                // "--single-process",
                "--start-maximized",
                "--use-gl=swiftshader",
                "--disable-gl-drawing-for-tests",
            ],
            ignoreDefaultArgs: ["--enable-automation"],
        });
        const page = await browser.newPage();
        await page.setRequestInterception(true);
        page.on("request", async (req) => {
            // 根据请求类型过滤
            const resourceType = req.resourceType();
            if (resourceType === "image") {
                req.abort();
            } else {
                req.continue();
            }
        });

        await Promise.all(
            addCookies(config.cookie, ".jd.com").map((pair) => {
                return page.setCookie(pair);
            })
        );

        await Promise.all([
            page.setUserAgent(userAgent.random()),
            page.setJavaScriptEnabled(true), //  允许执行 js 脚本
            page.goto(config.item_url, { waitUntil: "domcontentloaded" }),
        ]);

        let itemName = await page.$eval("body > div:nth-child(10) > div > div.itemInfo-wrap > div.sku-name", (el) => el.innerText);
        // 预约
        let searchYuyue = await page.$eval("#btn-reservation", (el) => el.innerText);
        if (searchYuyue === "开始预约") {
            await Promise.all([page.waitForNavigation(), await page.click("#btn-reservation")]);
            let yuyueSuccess = await page.$eval("#container > div > div.booking-bar.booking-result.success > div > div.bd-right > p.bd-right-result", (el) => el.innerText);
            if (yuyueSuccess.indexOf("成功") >= 0) {
                console.log(chalk.green(`${itemName}预约成功`));
            } else {
                console.log(chalk.green(`${itemName}预约失败`));
            }
        } else {
            console.log(chalk.green(`已经预约过了！`));
        }
        await browser.close();
    } catch (error) {
        console.log(error);
        await browser.close();
    }
};

module.exports = { jd_buy, jd_yuyue };
