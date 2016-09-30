
import sjcl from 'sjcl';
import m from 'more-entropy';

export default class Random {

    constructor(seeded) {

        var self = this;

        self.sjclRandom = new sjcl.prng(10);
        self.randomGenerator = new m.Generator({
          'loop_delay':        10, // how many milliseconds to pause between each operation loop. A lower value will generate entropy faster, but will also be harder on the CPU
          'work_min':           1, // milliseconds per loop; a higher value blocks the CPU more, so 1 is recommended
          'auto_stop_bits':  4096, // the generator prepares entropy for you before you request it; if it reaches this much unclaimed entropy it will stop working
          'max_bits_per_delta': 12, // a safety cap on how much entropy it can claim per value; 4 (default) is very conservative. a larger value will allow faster entropy generation
        });
        self.entropy = [];

        function addMoreEntropy() {
            self.moreEntropy(256, function() {
                if (self.sjclRandom.getProgress() < 1)
                    self.moreEntropy(256, function(){
                        addMoreEntropy()
                    });
                else if (seeded)
                    seeded();
            });
        }

        addMoreEntropy();
        return this;
    }

    moreEntropy(howMuch, callback){
        var self = this;
        self.randomGenerator.generate(howMuch, function(vals) {
            for (var v = 0; v < vals.length; v++){
                self.entropy.push(vals[v]);
                self.sjclRandom.addEntropy(vals[v]);
            }
            console.log('Seeded '+self.entropy.length+' values, % '+ (self.sjclRandom.getProgress()*100).toString()+ ' complete.');
            if (callback)
                callback();
        });
    }

    randomBytes(n) {
        const wordCount = Math.ceil(n * 0.25);
        const randomBytes = this.sjclRandom.randomWords(wordCount, 0);
        const hexString = sjcl.codec.hex.fromBits(randomBytes).substr(0, n * 2);
        return new Buffer(hexString, 'hex');
    }

    getProgress() {
        return this.sjclRandom.getProgress();
    }
}
