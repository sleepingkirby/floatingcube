# floating cube 

Web extension to look at/modify sugarcube variables

This extension ONLY WORKS FOR FIREFOX AND FIREFOX-VARIANT BROWSERS

This is because of the method which the plugin access in page javascript variables.


This extension is called "floating cube" because it "floats" to the top the variables you modify the most.

Features:
-SugarCube variable traversal
-Able to set a variable to be watched. I.E. SugarCube.State.active.variables.xp. Note that only scalar (strings, numbers, boolaens) values can be watched. Things like arrays or objects cannot as that's too much to display.
-Floating panel is draggable and minimize-able.
-Gives you access to set values to variables, push a value to an array, pop from an array, push to an object and delete an member (via index name) from an object.
-Saves your watches and edits within the browser into a profile.
-Allows for multiple profiles
