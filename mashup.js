const request = require('request');

const MASHUP_URL = 'https://webcomicname-mashup.glitch.me';
const IMAGE_BASE = 'https://s3.amazonaws.com/webcomicname.mashup';
const GOOD_STRIP_URL = 'https://s3.amazonaws.com/webcomicname.mashup/stripnumbers.json?cache=' + (new Date()).getTime();
const CACHE_VERSION = 6;
const BROKEN_TITLES = [9, 17, 18, 20, 47, 48, 58, 68, 92, 93, 94, 109, 126, 136, 147, 148, 232];

// get a strip number from the good strips
const getRandomStripNumber = (goodStrips, isTitle) => {
  const strips = isTitle ? goodStrips.filter(function(i) { return BROKEN_TITLES.indexOf(i) < 0 }) : goodStrips;
  const stripIndex =  Math.floor(Math.random() * strips.length);
  return goodStrips[stripIndex];
};

// 104_title
const getTitleURL = (titleNumber) => `${IMAGE_BASE}/title_${titleNumber}.png?v=${CACHE_VERSION}`;

// 146_2
const getPanelImageURL = (stripNumber, panelIndex) => `${IMAGE_BASE}/strip_${stripNumber}_${panelIndex}_without_title.png?v=${CACHE_VERSION}`;

// ['104_title', '180_0', '104_1', '146_2']
const getSavedURL = (imageKeys) => `${MASHUP_URL}/?images=${imageKeys.join(',')}`;

const loadMashup = (callback) => {
  request({
    url: GOOD_STRIP_URL,
    method: 'GET',
  }, (err, res, body) => {
    if (err) {
      console.error("oh no... there was an error getting good strips");
      console.error(err);
      return callback(err);
    }

    // This is dumb but it was one way for me to exclude strips that were not correctly split into panels
    // without messing with links to comics that people have already created
    const goodStrips = JSON.parse(body).stripnumbers;

    const titleNumber = getRandomStripNumber(goodStrips, true);
    const panelNumbers = [false, false, false].map(isTitle => getRandomStripNumber(goodStrips, isTitle));

    const imageURLs = [getTitleURL(titleNumber), ...panelNumbers.map((num, i) => getPanelImageURL(num, i))];

    const imageKeys = [`${titleNumber}_title`, ...panelNumbers.map((num, i) => `${num}_${i}`)];
    const savedURL = getSavedURL(imageKeys);

    callback(null, {
      imageURLs,
      savedURL
    });
  });
};

module.exports = loadMashup;
