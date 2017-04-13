var _ = require('lodash');
var fs = require('fs');
var RSVP = require('rsvp');
var cheerio = require('cheerio');
var request = require('request-promise');

var teamMappings = require('./teamMappings.json');


if (process.argv.length !== 3) {
  console.log('USAGE: node scrapeSchedule.js <output_file>');
  process.exit(1);
}

/**
 * Fetches the raw HTML schedule data for a given year.
 *
 * @param  {number} year The year whose schedule to fetch.
 * @return {Promise<Cheerio>} A Cheerio object containing the HTML schedule data.
 */
var getHtmlScheduleDataForYear = (year) => {
  return request({
    uri: 'http://www.und.com/sports/m-footbl/sched/data/nd-m-footbl-sched-' + year + '.html',
    transform: (body) => {
      return cheerio.load(body);
    }
  });
}


/**
 * Returns a list of game data for the provided year's games.
 *
 * @param  {number} year The year whose game data to fetch.
 * @return {Promise<Array<Object>>} A promise fulfilled with an array of objects containing game data.
 */
var getGamesForYear = (year) => {
  return getHtmlScheduleDataForYear(year).then(($) => {
    var games = [];

    var $scheduleTable = $('#schedtable');

    // Loop through each row in the schedule table
    var $rows = [];
    $scheduleTable.find('tr').each((i, row) => {
      $rows.push($(row));
    });

    // Ignore the headings row
    $rows = $rows.filter(($row) => {
      return !$row.hasClass('event-table-headings')
    });

    // Rows with four cells constitute an actual game
    $rows = $rows.filter(($row) => {
      var rowCells = $row.children('td');
      return (rowCells.length === 4);
    });

    var games = _.map($rows, ($row) => {
      var rowCells = $row.children('td');

      var result = $(rowCells[3]).text().trim();
      var opponent = $(rowCells[1]).text().trim();

      var isHomeGame = _.startsWith(opponent, 'vs.');

      // Strip off the 'vs.' or 'at' at the beginning of the opponent
      opponent = opponent.slice(3).trim();

      // Remove '(**** Bowl)' from any bowl games
      var isBowlGame = false;
      if (opponent.indexOf('Bowl') !== -1) {
        isBowlGame = true;
        opponent = opponent.split('(')[0].trim();
      }

      // TODO: clean up state abbreviations

      // Ignore Blue-Gold spring games and cancelled games
      if (!_.includes(opponent, 'Game') && result !== 'Cancelled') {
        return {
          result,
          isHomeGame,
          isBowlGame,
          opponent: teamMappings[opponent],
          date: $(rowCells[0]).text().trim(),
          location: $(rowCells[2]).text().trim()
        };
      }
    });

    games = games.filter((game) => !!game);

    return games;
  });
}


var years = _.range(1887, 2016);
var promises = {};
_.forEach(years, (year) => {
  // Skip 1890 and 1891 since und.com doesn't have data for those years
  if (year === 1890 || year === 1891) {
    return;
  }

  promises[year] = getGamesForYear(year).then((games) => {
    return _.map(games, (game) => {
      var numOvertimes = 0;

      // If the game has already been played, get the results and scores
      if (game.result[0] === 'W' || game.result[0] === 'L') {
        var resultData = game.result.split(', ');
        game.result = resultData[0];
        var scores = resultData[1].split('-');

        // Calculate the number of overtimes, if applicable
        if (scores[1].indexOf('OT') !== -1 || scores[1].indexOf('ot') !== -1) {
          numOvertimes = scores[1].split('(')[1][0];
          if (numOvertimes.toUpperCase() === 'O') {
            numOvertimes = 1;
          }
          scores[1] = scores[1].split('(')[0];
        }

        // Get the home and away scores
        if ((game.result === 'W' && game.isHomeGame) || (game.result === 'L' && !game.isHomeGame)) {
          homeTeamScore = parseInt(scores[0]);
          awayTeamScore = parseInt(scores[1]);
        }
        else {
          homeTeamScore = parseInt(scores[1]);
          awayTeamScore = parseInt(scores[0]);
        }

        // Add the score and number of overtimes to the game
        game.scores = {
          home: homeTeamScore,
          away: awayTeamScore
        };
        game.numOvertimes = numOvertimes;
      } else {
        // Add the time to the game
        game.time = game.result;
      }

      return game;
    });
  }).catch(function(error) {
    console.log(`Error scraping ${ year } schedule:`, error);
  });
});


return RSVP.hash(promises).then(function(result) {
  fs.writeFileSync(process.argv[2], JSON.stringify(result, null, 2));
  console.log(`Schedule written to ${ process.argv[2] }!`);
}).catch(function(error) {
  console.log('Failed to scrape schedule for all years:', error);
});
