const request = require("request");
const cliProgress = require("cli-progress");
const requestProgress = require("request-progress");
const fs = require("fs");
const path = require("path");
const ansiColors = require("ansi-colors");
const bytes = require("bytes");
const prompts = require("prompts");
let bar = new cliProgress.SingleBar(
  {
    format: formatter,
  },
  cliProgress.Presets.shades_classic
);

let i = 0;

(async () => {
  let { url, directory } = await prompts([
    {
      name: "url",
      message: "Send The File Url",
      type: "text",
      validate: (prev) => {
        try {
          new URL(prev);
          return true;
        } catch (e) {
          return "Please Send A Valid Url";
        }
      },
    },
    {
      name: "directory",
      message: "Send The File directory To Save",
      type: "text",
      validate: (prev) => {
        let dir = path.dirname(prev);
        if (!fs.existsSync(dir)) {
          return "This Is Invalid directory";
        } else return true;
      },
    },
  ]);
  let fileExt = path.extname(directory);
  if(!Boolean(fileExt)) fileExt = path.extname(url).replace(new URL(url).search,'');
  let fileName = path.basename(directory).replace(new URL(url).search,'');
  if(!Boolean(fileName)) fileName = path.basename(url).replace(new URL(url).search,'');
  requestProgress(request(url))
    .on("progress", function (state) {
      if (!state) return;
      if (i === 0) {
        bar.start(state.size.total, state.size.transferred, {
          state: state,
          filename: path.basename(url),
          ext: path.extname(path.basename(url)),
        });
        i++;
        return;
      }
      bar.update(state.size.transferred, {
        state: state,
        filename: path.basename(url),
        ext: path.extname(path.basename(url)),
      });
    })
    .on("end", function () {
      bar.stop();
      console.log(ansiColors.bold.green(`File Saved Successfully!`))
    })
    .on('error', (err) => {
        if(err.code === 'ENOTFOUND') {
            return console.log(ansiColors.red.bold('You Are Offline! Please Download A File When You Back Online Again.'));
        }
    })
    .pipe(fs.createWriteStream(
        path.resolve(directory.replace(fileName,'') + fileName.endsWith(fileExt) ? fileName: fileName + fileExt)
    ));
})();


let frames = [
  "( ●    )",
  "(  ●   )",
  "(   ●  )",
  "(    ● )",
  "(     ●)",
  "(    ● )",
  "(   ●  )",
  "(  ●   )",
  "( ●    )",
  "(●     )"
]

let ind = 0;
/**
 *
 * @param {cliProgress.Options} options
 * @param {cliProgress.Params} params
 * @param {{ state: { percent: number, speed: number, size: { total: number, transferred: number }, time: { elapsed: number, remaining: number } } }} payload
 */
function formatter(options, params, payload) {
  let { state, filename, ext } = payload;
  const bar = options.barCompleteString
  .substr(
    0,
    Math.round(params.progress * options.barsize)
  );
  if(ind >= frames.length - 1) ind = 0;
  ind++;
  let randcolor = '#' + Math.random().toString(16).substr(-6)

  return ` ${require('chalk').bold.hex(randcolor)(frames[ind])} Downloading... | [${ansiColors.green(
    bar
  )}] ${Math.floor(params.progress * 100)}% | Speed: ${
    state?.speed < 100000
      ? ansiColors.red(`${bytes(state?.speed)}/sec`)
      : ansiColors.green(`${bytes(state?.speed)}/sec`)
  } | Elapsed/remaining: ${ansiColors.yellow(
    Math.floor(state?.time.elapsed) + "Sec"
  )} / ${ansiColors.green(Math.floor(state?.time.remaining) + "Sec")} `;
}
