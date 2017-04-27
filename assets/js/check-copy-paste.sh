echo sudo npm install -g jsinspect

pp=../../../passepartout/assets/js
jsinspect --threshold 17 dialogs.js adresses.js detector.js \
	$pp/dialogs.js $pp/adresses.js $pp/detector.js $pp/detectmobilebrowser.js $pp/position.js

