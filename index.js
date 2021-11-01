const alfy = require('alfy');

import { scrape } from '/Users/graeme/Documents/Projects/puppeteer-tests/grade-scraper.js'

async function getGrades() {
    try {
        let gradeData = await scrape();

        let output = gradeData.map(x => (
            {
                title: x.length >= 5 ? x[4] : 'Ungraded',
                subtitle: x[0] + " - " + x[1],
                arg: 'https://mosaic.mcmaster.ca/',
                icon: './icon.png'
            }
        ));

        alfy.output(output)   
    } catch (e) {
        alfy.output([{
            title: e.name,
            subtitle: e.message,
            icon: './icon.png'
        }])
    }
};
getGrades()