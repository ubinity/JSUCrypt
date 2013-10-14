/*
************************************************************************
Copyright (c) 2013 UBINITY SAS,  Cédric Mesnil <cedric.mesnil@ubinity.com>

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*************************************************************************
*/
/**
 * @project UCrypt
 * @author Cédric Mesnil <cedric.mesnil@ubinity.com>
 * @license Apache License, Version 2.0
 */

/** 
 * 
 * All hasher support a unified API:
 * 
 *  - void reset()
 *  - void update(data)
 *  - void finalize(data) 
 * 
 * ### Creating hasher
 * 
 * To create an XXX hasher:
 * 
 *   - new UCrypt.hash.XXX()
 * 
 * Supported XXX cipher are:
 *  
 *   - SHA1
 *   - SHA256
 *   - SHA224
 *   - RIPEMD160
 * 
 * ### Examples
 * 
 * example 1:
 *         
 *         var sha = new UCrypt.hash.SHA1();
 *         var h = sha.finalize("616263")
 *         
 * 
 * example 2:
 *         
 *         var sha = new UCrypt.hash.SHA1();
 *         sha.upate("61")*
 *         var h =  sha.finalize("6263")
 *         
 * 
 * example 3:
 *         
 *         var sha = new UCrypt.hash.SHA1();
 *         sha.upate("60")*
 *         sha.reset();
 *         var h =  sha.finalize("616263")
 *         
 * --------------------------------------------------------------------------
 * @namespace UCrypt.hash 
 */
UCrypt.hash  || (function (undefined) {

    /**
     * @lends UCrypt.hash
     */
    var hash = {
        /** @class UCrypt.hash.SHA1 */
        SHA1: undefined,
        /** @class UCrypt.hash.SHA224 */
        SHA224: undefined,
        /** @class UCrypt.hash.SHA256 */
        SHA256: undefined,
        /** @class UCrypt.hash.RIPEMD160 */
        RIPEMD160: undefined,
    };

    /**
     * Reinit hasher as it was just created.
     * The hasher is ready for new computation.
     *
     * @name  UCrypt.hash#reset
     * @function
     * @memberof UCrypt.hash
     * @abstract
     */
    /**
     * Add more data to the hash
     * @param {anyBA} [block] data to add before ending computation
     *
     * @name  UCrypt.hash#update
     * @function
     * @memberof UCrypt.hash
     * @abstract
     */
     /**
     * Add more data to hash, terminate computation and return the computed hash
     * @param {anyBA} [block] data to add before ending computation
     * @returns {byte[]} hash
     *
     * @name UCrypt.hash#finalize
     * @function
     * @memberof UCrypt.hash
     * @abstract
     */

    // --- Hash Helper ---
    hash._reset = function() {
        this._hash  = [].concat(this._IV);
        this._block = [];
        this._msglen = 0;
    };


   hash._update = function(block) {
        block  = UCrypt.utils.anyToByteArray(block);
        if (block == undefined)  {
            block = [];
        }
        this._block =  this._block.concat(block);        
        if ( this._block.length<64) {
            return;
        } 
        do {
            this._msglen += 64;
            // Build next 32bits block M
            // 16word M15, M14.....M0        
            var M = [];            
            for (var i = 0; i < 16; i++) {
                if (this._BE) {
                    M[i] = 0xFFFFFFFF&
                        ( (this._block[i*4+0]<<24) |
                          (this._block[i*4+1]<<16) |
                          (this._block[i*4+2]<<8)  |
                          (this._block[i*4+3]<<0)  );
                } else {
                    M[i] = 0xFFFFFFFF&
                        ( (this._block[i*4+3]<<24) |
                          (this._block[i*4+2]<<16) |
                          (this._block[i*4+1]<<8)  |
                          (this._block[i*4+0]<<0)  );
                }
            }
            this._block = this._block.slice(64);
            //process block 64bytes set in 32bits array
            this._process(M);
        } while (this._block.length>=64);        
    };

    hash._finalize = function(block) {
        block  = UCrypt.utils.anyToByteArray(block);
        if (block == undefined)  {
            block = [];
        }
        
        this.update(block);
        var msglen = this._msglen + this._block.length;
        this._block.push(0x80);
        if ((64-this._block.length)<8) {
            while (this._block.length<64) {
                this._block.push(0);
        }
            this.update([]);
        }
        while (this._block.length<64) {
            this._block.push(0);
        }
        
        //pad
        msglen = msglen*8;    
        if (this._BE) {
            this._block[64-4] = (msglen>>24) & 0xFF;
            this._block[64-3] = (msglen>>16) & 0xFF;
            this._block[64-2] = (msglen>>8)  & 0xFF;
            this._block[64-1] = (msglen)     & 0xFF;
        } else {
            this._block[64-8] = (msglen)     & 0xFF;
            this._block[64-7] = (msglen>>8)  & 0xFF;
            this._block[64-6] = (msglen>>16) & 0xFF;
            this._block[64-5] = (msglen>>24) & 0xFF;
        }
        //last padded block
        this.update([]);
        
        //build hash array
        var h = [];
        var offset = 0;
        var i;
        if (this._BE) {
            for (i = 0; i < this._nWords; i++) {
                h.push( (this._hash[i]>>24) &0xFF,
                        (this._hash[i]>>16) &0xFF,
                        (this._hash[i]>>8)  &0xFF,
                        (this._hash[i])      &0xFF );
                offset+=4;
            }
        } else {
            for (i = 0; i < this._nWords; i++) {
                h.push( (this._hash[i])     &0xFF,
                        (this._hash[i]>>8)  &0xFF,
                        (this._hash[i]>>16) &0xFF,
                        (this._hash[i]>>24) &0xFF );
                offset+=4;
            }
        }
        this.reset();
        return h;
    };

    // --- Set it ---
    UCrypt.hash = hash;
}());