.PHONY: package install

all: package

package:
	vsce package

install: package
	npm install -g vsce
