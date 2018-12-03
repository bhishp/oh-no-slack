const express = require("express");
const request = require("request");
const bodyParser = require("body-parser");

const loadMashup = require("./mashup");
const loadTumblr = require("./tumblr");

const clientId = process.env.SLACK_CLIENT_ID;
const clientSecret = process.env.SLACK_CLIENT_SECRET;

const OH_NO_COLOR = "#fe7db5";
const GIT_URL = "https://github.com/bhishp/oh-no-slack";

const app = express();
app.use(express.static("public"));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

const PORT = parseInt(process.env.PORT) || 4390;

app.listen(PORT, () => {
  console.log("oh no... we're on port " + PORT);
});

app.get("/", (req, res) => res.redirect(GIT_URL));

// Handling Slack oAuth process
app.get("/oauth", (req, res) => {
  if (!req.query.code) {
    res.status(500);
    res.send({ "Error": "oh no... we need a code to authorize you" });
    console.error("oh no... we need a code to authorize you");
    return;
  }

  // call slack's oauth.access
  request({
    url: "https://slack.com/api/oauth.access",
    qs: {
      code: req.query.code,
      client_id: clientId,
      client_secret: clientSecret
    },
    method: "GET",
  }, (accessErr, accessRes, accessBody) => {
    if (accessErr) {
      res.status(500);
      res.send({ "Error": "oh no... there was an error authorizing you" });
      console.error("oh no... there was an error calling slack's oauth.access");
      console.error(accessErr);
      return;
    }
    const { ok, error } = JSON.parse(accessBody);
    if (!ok) {
      res.status(500);
      res.send({ "Error": "oh no... there was an error authorizing you" });
      console.error("oh no... there was an error calling slack's oauth.access");
      console.error(error);
      return;
    }
    console.log("oauth.access success");
    res.redirect(GIT_URL);
  });
});

app.post("/ohno", (req, res) => {
  const { text, response_url } = req.body;
  res.set("Content-Type", "application/json");

  // retrieve a mashup comic from the Glitch app
  if (text === "mashup") {
    // send initial response
    res.send();

    loadMashup((err, mashupData) => {
      if (err) {
        console.error("oh no... an error happened when loading the mashup");
        return;
      }
      console.log("loaded mashup data");

      const slackRes = {
        response_type: "in_channel",
        attachments: mashupData.imageURLs.map((image_url, i) => (
          i === 0 ?
            {
              title: "Keep this comic",
              title_link: mashupData.savedURL,
              fallback: "oh no... missing title",
              image_url,
            } :
            {
              fallback: "oh no... missing panel",
              image_url,
            }
          ))
      };

      request({
        url: response_url,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        json: slackRes
      });
    });
    return;
  }

  // retrieve a random comic from the tumblr blog
  if (text === "comic") {
    // send initial response
    res.send();

    loadTumblr((err, image_url) => {
      if (err) {
        console.error("oh no... an error happened when loading the tumblr comic");
        return;
      }
      console.log("loaded tumblr data");

      const slackRes = {
        response_type: "in_channel",
        attachments: [{
          fallback: "oh no... could not load the comic",
          image_url,
        }]
      };
      request({
        url: response_url,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        json: slackRes
      });
    });
    return;
  }

  // oh no...
  res.send(
    {
      response_type: "in_channel",
      attachments: [
        {
          color: OH_NO_COLOR,
          fallback: "oh no...",
          image_url: "https://api.tumblr.com/v2/blog/webcomicname/avatar/512"
        }
      ]
    }
  );
});
