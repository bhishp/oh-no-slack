const request = require('request');

const api_key = process.env.TUMBLR_CONSUMER_KEY;
const API_URL = 'https://api.tumblr.com';
const POSTS_URL = '/v2/blog/webcomicname/posts';
// max allowed by tumblr api
const POST_LIMIT = 20;

const loadPost = callback => {
  const url = `${API_URL}${POSTS_URL}`;
  console.log(`GETing ${url}`);
  request({
    url,
    method: 'GET',
    qs: {
      api_key,
      // works on the naive assumption that all the photo posts on the blog are comic strips, we might actually not get a comic, maybe just a photo of a dog. oh no...
      type: 'photo',
    },
  }, (err, res, body) => {
    if (err || !body) {
      console.error("oh no... there was an error getting tumblr posts");
      console.error(err);
      return callback(err);
    }
    const data = JSON.parse(body);
    const {
      response: { total_posts }
    } = data;

    console.log(total_posts);
    // work out our post range
    const pages = Math.ceil(total_posts / POST_LIMIT);
    const page_number = Math.ceil(Math.random() * pages); // 1 - 14
    const offset = (page_number - 1) * 20;

    console.log(`GETing ${API_URL}${POSTS_URL} with qs page_number=${page_number} and offset=${offset}`);
    request({
      url,
      method: 'GET',
      qs: {
        api_key,
        type: 'photo',
        page_number,
        offset,
      },
    }, (err, res, body) => {
      if (err || !body) {
        console.error("oh no... there was an error getting tumblr posts");
        console.error(err);
        return callback(err);
      }
      const data = JSON.parse(body);
      const {
        response: {
          posts
        }
      } = data;
      const post = posts[Math.floor(Math.random() * POST_LIMIT)];
      const comicUrl = post.photos[0].original_size.url;
      callback(null, {
        postUrl: post.post_url,
        comicUrl
      });
    });

  });
};

module.exports = loadPost;
