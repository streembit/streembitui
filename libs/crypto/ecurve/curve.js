/*

This file is part of Streemio application. 
Streemio is an open source project to create a real time communication system for humans and machines. 

Streemio is a free software: you can redistribute it and/or modify it under the terms of the GNU General Public License 
as published by the Free Software Foundation, either version 3.0 of the License, or (at your option) any later version.

Streemio is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of 
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Streemio software.  
If not, see http://www.gnu.org/licenses/.
 
-------------------------------------------------------------------------------------------------------------------------
Author: Tibor Zsolt Pardi 
Copyright (C) 2016 The Streemio software development team
-------------------------------------------------------------------------------------------------------------------------

This cryptography implementation is forked from the crypto libraries of http://cryptocoinjs.com/ 

*/

var assert = require('assert')
var BigInteger = require('bigi')

var Point = require('./point')

function Curve (p, a, b, Gx, Gy, n, h) {
  this.p = p
  this.a = a
  this.b = b
  this.G = Point.fromAffine(this, Gx, Gy)
  this.n = n
  this.h = h

  this.infinity = new Point(this, null, null, BigInteger.ZERO)

  // result caching
  this.pOverFour = p.add(BigInteger.ONE).shiftRight(2)
}

Curve.prototype.pointFromX = function (isOdd, x) {
  var alpha = x.pow(3).add(this.a.multiply(x)).add(this.b).mod(this.p)
  var beta = alpha.modPow(this.pOverFour, this.p) // XXX: not compatible with all curves

  var y = beta
  if (beta.isEven() ^ !isOdd) {
    y = this.p.subtract(y) // -y % p
  }

  return Point.fromAffine(this, x, y)
}

Curve.prototype.isInfinity = function (Q) {
  if (Q === this.infinity) return true

  return Q.z.signum() === 0 && Q.y.signum() !== 0
}

Curve.prototype.isOnCurve = function (Q) {
  if (this.isInfinity(Q)) return true

  var x = Q.affineX
  var y = Q.affineY
  var a = this.a
  var b = this.b
  var p = this.p

  // Check that xQ and yQ are integers in the interval [0, p - 1]
  if (x.signum() < 0 || x.compareTo(p) >= 0) return false
  if (y.signum() < 0 || y.compareTo(p) >= 0) return false

  // and check that y^2 = x^3 + ax + b (mod p)
  var lhs = y.square().mod(p)
  var rhs = x.pow(3).add(a.multiply(x)).add(b).mod(p)
  return lhs.equals(rhs)
}

/**
 * Validate an elliptic curve point.
 *
 * See SEC 1, section 3.2.2.1: Elliptic Curve Public Key Validation Primitive
 */
Curve.prototype.validate = function (Q) {
  // Check Q != O
  assert(!this.isInfinity(Q), 'Point is at infinity')
  assert(this.isOnCurve(Q), 'Point is not on the curve')

  // Check nQ = O (where Q is a scalar multiple of G)
  var nQ = Q.multiply(this.n)
  assert(this.isInfinity(nQ), 'Point is not a scalar multiple of G')

  return true
}

module.exports = Curve
