require("dotenv").config();

const Express = require('express');
const app = Express();
const {existsSync, mkdirSync, promises} = require("fs");
const {writeFile} = promises;
const {join} = require("path");
const {webcrypto} = require("crypto");

// basic security
const helmet = require("helmet");
const CORS = require("cors");
app.use(helmet()).use(CORS());

// create bin folder
const binPath = join(__dirname, "bin");
if (!existsSync(join(__dirname, "bin"))) {
  mkdirSync(binPath);
};

app.get(["/", "/:fileid"], (req, res) => {
  const fileID = req?.params?.fileid;
  if (!fileID?.length) return res.sendStatus(200);

  const path = join(binPath, fileID);
  return res.type("text/plain").sendFile(path, (err) => {
    if (err) {
      res.status(400).send("unable to retrieve bin content.");
    };
  })
});

app.post("/", async (req, res) => {
  // we use auth for this one, just in case
  if (!req.headers.authorization || req.headers.authorization !== process.env.SECRET) {
    return res.sendStatus(403);
  };

  // limit
  const limit = 1e6; // 1m
  if (req.headers["content-type"] !== "text/plain") return res.status(400).send("invalid content type.");
  if (!req?.body?.length) return res.status(411).send("the body is mandatory.");
  if (req.body.length > limit) return res.sendStatus(413);

  const fileID = randomID();
  try {
    await writeFile(join(binPath, fileID), req.body);
    return res.status(200).type("text/plain").send(fileID);
  } catch (err) {
    console.error(err);
    return res.status(500).end();
  };
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Bin: Ready, with port [${PORT}]`);
})

function getPseudoRandomNumber(min, max) {
  const array = new Uint32Array(1);
  webcrypto.getRandomValues(array);
  return min + (array[0] % (max - min + 1));
};

function randomID() {
  let length = getPseudoRandomNumber(6, 20);
  let charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_";
  let retVal = "";

  for (let i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(getPseudoRandomNumber(0, n));
  };

  return retVal;
};