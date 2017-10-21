import React from 'react';
import format from 'date-fns/format';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Link } from 'react-router-dom';

import './Game.css';


const Game = ({ game, year, index, selected }) => {
  let lastColumnContent;
  if ('result' in game) {
    const opponentScore = game.isHomeGame ? game.score.away : game.score.home;
    const notreDameScore = game.isHomeGame ? game.score.home : game.score.away;

    let result;
    if (notreDameScore > opponentScore) {
      result = <span className='win'>W</span>;
    } else if (opponentScore > notreDameScore) {
      result = <span className='loss'>L</span>;
    } else {
      result = <span className='tie'>T</span>;
    }

    lastColumnContent = (
      <p className='score'>{ result } { notreDameScore } - { opponentScore }</p>
    );
  } else if ('timestamp' in game) {
    lastColumnContent = (
      <div className='coverage'>
        <img
          alt={`${game.coverage} logo`}
          src={require(`../images/tvLogos/${game.coverage.toLowerCase()}.png`)}
        />
      </div>
    );
  } else {
    lastColumnContent = <p className='coverage'>TBD</p>;
  }

  const gameClassNames = classNames({
    game: true,
    selected: selected,
    homeGame: game.isHomeGame,
    awayGame: !game.isHomeGame
  });

  let prefix = game.isHomeGame ? '' : '@';

  let date;
  if ('timestamp' in game) {
    date = format(game.timestamp, 'MMMM D, h:mm A');
  } else {
    date = format(game.date, 'MMMM D') + ', TBD';
  }

  // TODO: remove hard-coded URL when all teams have a logo URL
  return (
    <Link className={gameClassNames} to={`/${year}/${index + 1}/`}>
      <img
        className='opponent-logo'
        src={`${game.opponent.logoUrl || 'http://www.texassports.com/images/logos/Oklahoma.png'}?width=80&height=80&mode=max`}
        alt={`${game.opponent.name} logo`} />
      <div>
        <p className='date'>{date}</p>
        <p className='opponent'>{prefix} {game.opponent.name}</p>
      </div>
      <p className='location'>{game.location}</p>
      {lastColumnContent}
    </Link>
  );
};

// TODO: finish these
Game.propTypes = {
  game: PropTypes.object.isRequired
};

export default Game;
