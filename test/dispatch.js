var EventDispatcher = require('../index.js');
var fs = require('fs');
var path = require('path');

var ed = new EventDispatcher();
ed.debug = true;

var TESTER = {
    A: 'TESTER',
    
    fnA: function() {
        console.log('~ in TESTER.fnA(); this.A: ' + this.A + '; data: ' + arguments[0]);
    },
    
    fnB: function() {
        console.log('~ in TESTER.fnB(); this.A: ' + this.A + '; data: ' + arguments[0]);
    }
};

function fnC(data) {
    console.log('~ in fnC(); this.A: ' + this.A + '; data: ' + arguments[0]);
    
    if (data === 'world') {
        ed.dispatch('sub.hello', 'sub.world');
    }
}

var msgo = '';
ed._doLog = function(msg) {
    console.log('EventDispatcher: ' + msg);
    msgo += msg + '\r\n';
};

ed.addListener('hello', TESTER, 'fnB');
ed.addListener('hello', TESTER, fnC);
ed.addListener('hello', fnC);
ed.addListener('hello', TESTER, TESTER.fnA, 100); // priority: 100 => runs first
ed.addListener('sub.hello', fnC);

ed.dispatch('hello', 'world');

// if you write more tests, run this script with `node dispatch.js rebuild` to refresh the expected.txt content.

// check output

var expectedContentFile = path.resolve(__dirname, 'expected.txt');
if (process.argv[2] && process.argv[2] === 'rebuild') {
    fs.writeFileSync(expectedContentFile, msgo);
    console.log('expexted data saved..');
} else {
    var expo = fs.readFileSync(expectedContentFile).toString();
    if (expo === msgo) {
        console.log('\r\n-- TEST PASSED --');
    } else {
        for (var i = 0; i < msgo.length; ++i) {
            if (expo[i] !== msgo[i]) {
                console.log('-- TEST FAILED --, mismatch on char ' + i + ': ' + expo[i] + ' != ' + msgo[i]);
                break;
            }
        }
    }
}



