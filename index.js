require('dotenv').config({ path: __dirname + "/.env" });
const puppeteer = require('puppeteer');
const alfy = require('alfy');

let launchOptions = {
    headless: true,
    defaultViewport: {
        width: 800,
        height: 600
    }
}

/**
 * Main function that runs puppeteer through mosaic interface then scrapes grade text from page and returns data to Alfred
 */
async function getGrades() {
    // terminal flag to check if the 'terminal' parameter was passed, indicating it was run through the terminal
    let terminal =  process.argv[2] === 'terminal'

    var browser, page;
    try {
        browser = await puppeteer.launch(launchOptions);
        page = await browser.newPage();
        await page.setDefaultTimeout(15000);

        if (terminal) {
            process.stdout.write("\r\x1b[K")
            process.stdout.write("Scraping... 0%");
        }

        await page.goto('https://epprd.mcmaster.ca/psp/prepprd/?cmd=login');  

        if (terminal) {
            process.stdout.write("\r\x1b[K")
            process.stdout.write("Scraping... 20%");
        }
        // username
        await page.waitForSelector("#userid");
        await page.type("#userid", process.env.MOSAIC_USERNAME);

        // password
        await page.waitForSelector("#pwd");
        await page.type("#pwd", process.env.MOSAIC_PASSWORD);

        // submit button
        await page.waitForSelector(".ps_box-button > span > input")
        await page.click(".ps_box-button > span > input")

        if (terminal) {
            process.stdout.write("\r\x1b[K")
            process.stdout.write("Scraping... 40%");
        }

        // get all tile titles from first page
        await page.waitForSelector(".ps_box-scrollarea > div:first-child .ps_grid-div.ps_grid-body > div > div:first-child > div > div > span", {visible: true});
        let titles = await page.$$eval(
            ".ps_box-scrollarea > div:first-child .ps_grid-div.ps_grid-body > div > div:first-child > div > div > span",
            options => options.map(option => option.innerText)
        );
        
        let gradesIndex = titles.indexOf('Grades') + 1  

        // click grades tile
        await page.click(`.ps_grid-div.ps_grid-body > div:nth-child(${gradesIndex}) > div:first-child > div`);

        if (terminal) {
            process.stdout.write("\r\x1b[K")
            process.stdout.write("Scraping... 60%");
        }

        // --- Sometimes not needed ---
        // modal ok button
        await page.waitForSelector("#okbutton input", {visible: true});
        await page.click("#okbutton input");
        
        //wait for iFrame
        await page.waitForSelector("#ptifrmtarget")
        await page.waitForTimeout(1000)

        // get content iframe
        const target = await page.frames().find(f => f.name() === 'TargetContent')

        // --- Sometimes not needed ---
        // change term
        await target.waitForSelector("#ACE_width .PSPUSHBUTTON.Left")
        await target.click("#ACE_width .PSPUSHBUTTON.Left");   

        // fall 2020
        await target.waitForSelector("#ACE_width > tbody > tr:nth-child(4) table table > tbody > tr:nth-child(3) input");
        await target.click("#ACE_width > tbody > tr:nth-child(4) table table > tbody > tr:nth-child(3) input");
        
        // submit button
        await target.waitForSelector("#ACE_width .PSPUSHBUTTON:not(.Left)");
        await target.click("#ACE_width .PSPUSHBUTTON:not(.Left)");

        if (terminal) {
            process.stdout.write("\r\x1b[K")
            process.stdout.write("Scraping... 80%");
        }
        //modal ok button
        await page.waitForSelector("#okbutton input", {visible: true});
        await page.click("#okbutton input");
        
        // get new content iframe
        await page.waitForSelector("#ptifrmtarget")
        const newTarget = await page.frames().find(f => f.name() === 'TargetContent');

        await page.screenshot({
            path: './screenshot.png',
            clip: {
                x: 34,
                y: 259,
                width: 631,
                height: 141
            }
        })

        // get raw grade data
        const gradeData = await newTarget.evaluate(() => {
            let rows = Array.from(document.querySelectorAll(".PSLEVEL1GRID > tbody > tr")).slice(1)
            return rows.map(el => {
                let textArr = el.innerText.split('\n');
                return textArr.filter( (el) => /\S/.test(el) );
            })
        });

        await browser.close()

        let output = gradeData.map(x => (
            {
                title: x.length !== 6 ? 'Ungraded' : x[4],
                subtitle: x[0] + " - " + x[1],
                arg: 'https://mosaic.mcmaster.ca/',
                icon: './icon.png'
            }
        )); 

        if (terminal) {
            process.stdout.write("\r\x1b[K")
            process.stdout.write("Scraping... 100%\n");
        } else {
            alfy.output(output)
        }
            
        // pretty print grade data
        if (terminal) {
            console.log('-------Grade Data-------');
            for (let i = 0; i < gradeData.length; i++) {
                console.log(
                    gradeData[i][0], 
                    "\t",
                    gradeData[i].length !== 6 ? 'Ungraded' : gradeData[i][4]
                );  
            }
        }     
    } catch (e) {
        if (terminal) {
            console.log('\n'+e.name);
            console.log(e.message);
            console.log('Sending alert text');
        } else {
            alfy.output([{
                title: e.name,
                subtitle: e.message,
                icon: './icon.png'
            }])
        }

        await browser.close()
    }
};



getGrades()
