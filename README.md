## Streembit - decentralized, P2P communication system for humans and Internet of Things devices.

http://streembit.github.io/

What is Streembit?
-----------------

Streembit is an open source, peer-to-peer communication network for humans and machines. We aim to solve secure, decentralized network formation with Streembit. Streembit uses peer-to-peer technology to operate with no central authority: discovering contacts, persisting the data and routing messages are carried out collectively by the network. It is primarily secured by elliptic curve public/private key cryptography infrastructure (PPKI). 

Streembit comes with video calls, audio calls, text chat, file transfer, screen sharing, and the ability to connect to your Internet-of-Things devices.

Streembit is optimized for the Internet-of-Things. Along with complying with open security and communication standards our developers take an active role in the W3C Web of Things Initiative (https://github.com/w3c/web-of-things-framework) and mirror all WoT standards in the Streembit codebase.

Please join our Gitter (https://gitter.im/orgs/streembit/rooms) if you would like to chat! 

For more information, as well as an immediately useable, packaged version of the Streembit software, see http://streembit.github.io/download.

For help using Streembit please visit the documentation: http://streembit.github.io/documentation/

License
-------

Streembit is a completely free and open source software. Streembit is released under the terms of the GNU General Public License. See [COPYING](COPYING) for more
information or see http://www.gnu.org/licenses/.


Building Streembit
-----------------

If you would like to build Streembit from the source instead of using the prebuilt binaries (found at http://streembit.github.io/download) follow the build workflow described in [BUILD.md](BUILD.md).


Development Process
-------------------

The `master` branch is regularly built and tested, but is not guaranteed to be
completely stable. [Tags](https://github.com/streembit/streembit/tags) are created
regularly to indicate new official, stable release versions of Streembit Core.

The contribution workflow is described in [CONTRIBUTING.md](CONTRIBUTING.md).

The developer [forum](https://gitter.im/streembit)
should be used to discuss complicated or controversial changes before working
on a patch set.


Testing
-------

Testing and code review is the bottleneck for development; we get more pull
requests than we can review and test on short notice. Please be patient and help out by testing
other people's pull requests, and remember this is a security-critical project where any mistake might cost people
lots of money.

### Automated Testing

Developers are strongly encouraged to write [unit tests](/doc/unit-tests.md) for new code, and to
submit new unit tests for old code. Unit tests can be compiled and run
(assuming they weren't disabled in configure) with: `make check`


### Manual Quality Assurance (QA) Testing

Changes should be tested by somebody other than the developer who wrote the
code. This is especially important for large or high-risk changes. It is useful
to add a test plan to the pull request description if testing the changes is
not straightforward.


Translations
------------

Changes to translations as well as new translations can be submitted to
[Bitcoin Core's Transifex page](https://www.transifex.com/projects/p/streembit/).

Translations are periodically pulled from Transifex and merged into the git repository. See the
[translation process](doc/translation_process.md) for details on how this works.

**Important**: We do not accept translation changes as GitHub pull requests because the next
pull from Transifex would automatically overwrite them again.


