const giturl = "https://github.com/yafyz/nitrsnip";
const fs = require("fs");
const chp = require("child_process");

var child = null;

function execasync(cmd) {
    return new Promise((res, rej)=>{
        chp.exec(cmd, (err, stdout, _)=>{
            if (err)
                return rej(err);
            res(stdout);
        })
    });
}

function fork_child() {
    child = chp.fork("src/main.js");
    child.on("exit", ()=>{
        console.log("Child has exited, restarting");
        fork_child();
    });
}

(async ()=>{
    if (!fs.existsSync("src")) {
        console.log("Cloning...");
        await execasync(`git clone ${giturl} src`);
        console.log("Installing dependencies");
        if (process.env.is_heroku != undefined)
        await execasync("cd src && npm install");
    }

    setInterval(async ()=>{
        let ret = await execasync("cd src && git pull");
        if (ret.trim() == "Already up to date.")
            console.log("Repo is up to date");
        else {
            console.log("Pulled new commits")
            console.log(ret);
            console.log("Installing dependencies");
            await execasync("cd src && npm install");
            console.log("Restarting nitrsnip");
            child.kill();
        }
    }, 60000)

    fork_child();
})();