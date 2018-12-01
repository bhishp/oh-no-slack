// just a little hacky file for scraping through tumblr posts of webcomicname

require('dotenv').config();
const request = require('request');
const fs = require('fs');

const API_URL = 'https://api.tumblr.com';

// max allowed by tumblr api
// const POST_LIMIT = 20;

const api_key = process.env.TUMBLR_CONSUMER_KEY;


let postsCount = 0;

const recursePosts = (href = '/v2/blog/webcomicname/posts') => {
  console.log(`GETing ${href}`);
  request({
    url: `${API_URL}${href}`,
    method: 'GET',
    qs: {
      api_key,
      type: 'photo',
    },
  }, (err, res, body) => {
    if (err) {
      console.error("oh no... there was an error getting good strips");
      console.error(err);
      return;
    }
    const data = JSON.parse(body);
    const {
      response: {
        posts,
        _links
      }
    } = data;

    fs.writeFileSync('./posts.json', JSON.stringify(JSON.parse(body), null, 2));

    postsCount += posts ? posts.length : 0;
    console.log(postsCount);

    if (_links) {
      const {
        next: {
          href: nextHref
        }
      } = _links;
      recursePosts(nextHref);
      return;
    }
    console.log("no links");

  });
};

recursePosts();


