'use strict';

var spawn = require('child_process').spawn;

var gulpMultiProcess = function(tasks, cb) {
  var completed = 0;
  var code = 0;

  var workers = [];

  var killedAllWorkers = false;
  var killAllWorkers = function() {
    if (!killedAllWorkers) {
      console.log('killing all workers');
      workers.forEach(
        function(worker) {
          worker.kill();
        }
      );
      process.exit(1);
    }
  };

  tasks.forEach(function(taskName) {
    var args = [process.argv[1], taskName];

    process.argv.forEach(function (val) {
      if(val[0] === '-' && val !== '--gulpfile') {
        args.push(val);
      }
    });

    var worker = spawn(process.execPath, args);
    workers.push(worker);

    worker.on('error', 
      function(err) 
      {
        console.log(':::::error:::::');
        killAllWorkers();
        cb(err);
      }
    );

    worker.on('close', function(workerCode) {
        console.log(':::::close:::::');
        killAllWorkers();
        cb(workerCode);
    })

    worker.stderr.on('data',
      function(data) 
      {
        console.log(':::::stderr:::::');
        killAllWorkers();
        cb(data);
      }
    )

    worker.stdout.on('data', 
      function(data) {
        console.log(':::data:::');
        var part = data.toString();
        if (part.indexOf('Error') !== -1) {
          killAllWorkers();
          cb(data);
        }
        console.log(part);
      }
    );

    worker.on('exit', function (workerCode) {
      if(workerCode !== 0)  {
        killAllWorkers();
        cb(workerCode);
        return;
      }

      completed++;

      if(completed === tasks.length) {
        cb(0);
      }
    });
  });
};

module.exports = gulpMultiProcess;

