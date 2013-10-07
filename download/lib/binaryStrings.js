(function (exports) {
    var first_letter_code = 97,
        first_digit_code = 48,
        characters;

    characters = (function () {
        var i, string = "";

        for (i=0; i < 32; i++) {

            // letters
            if (i < 10) {
                // it's just a digit, leave it as is
                string += i;
            }
            else {
                string += String.fromCharCode(first_letter_code + i - 10);
            }
        }
        return string;
    })();

    /**
     * long story short, if take bit which from source and set it to dest[which + offset]
     * @param {Number} source
     * @param {ArrayBuffer} dest
     * @param {Number} which
     * @param {Number} offset
     */
    function arrayCopyBit(source, dest, which, offset) {
        var compare = (1 << which);
        dest[which + offset] = (source & compare !== 0) | 0;
        console.log(which, source & compare)
    }

    function base32ToArrayBuffer(string) {
        // note that up to 7 bits may go unused
        var i, uint5value,
            odd = false,
            buffer = new ArrayBuffer(Math.ceil(string.length / 2));

        // let's be a little lienent here
        string = string.toLowerCase();

        for ( i = 0; i < string.length; i++, odd = !odd ) {
            uint5value = characters.indexOf(string[i]);

            // did we find a match in our array of characters?
            if (uint5value >= 0) {
                // just insert this number into our array
                arrayCopyBit(uint5value, buffer, 0, i * 5);
                arrayCopyBit(uint5value, buffer, 1, i * 5);
                arrayCopyBit(uint5value, buffer, 2, i * 5);
                arrayCopyBit(uint5value, buffer, 3, i * 5);
                arrayCopyBit(uint5value, buffer, 4, i * 5);
            }

            // if not, then we're not workign with a base32
            // ... so just yell at the programmer
            else {
                throw new RangeError("base32ToArrayBuffer was called with " + string
                    + " which is not base32 (0-9 and a-v)");
            }
        }

        return buffer;
    }


    function arrayBufferToBase32(ab) {

    }

    exports.base32ToArrayBuffer = base32ToArrayBuffer;
    exports.arrayBufferToBase32 = arrayBufferToBase32;
    return exports;

})(this || {});