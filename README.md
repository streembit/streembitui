## Streembit - decentralized, P2P communication system for humans and Internet of Things devices.

http://streembit.github.io/

What is Streembit?
-----------------

Streembit is an experimental decentralised communication system for humans and 
Internet of Things devices. Streembit uses peer-to-peer technology to operate
with no central authority: discovering contacts, persisting the data and routing 
messages are carried out collectively by the network. Streembit Core is the name 
of open source software which enables the use of this P2P network.

For more information, as well as an immediately useable, binary version of
the Streembit Core software, see http://streembit.github.io/download.

License
-------

Streembit is a completely free and open source software. Streembit is released under the terms of the GNU General Public License. See [COPYING](COPYING) for more
information or see http://www.gnu.org/licenses/.


Building Streembit
-----------------

The build workflow is described in [BUILD.md](BUILD.md).


Development Process
-------------------

The `master` branch is regularly built and tested, but is not guaranteed to be
completely stable. [Tags](https://github.com/streembit/streembit/tags) are created
regularly to indicate new official, stable release versions of Streembit Core.

The contribution workflow is described in [CONTRIBUTING.md](CONTRIBUTING.md).

The developer [forum](https://gitter.im/streembit/Streembit)
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


