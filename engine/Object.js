//still missing:
// - SetChild
// - DebugMetaData
// - bool operators

import {Path} from './Path';

export class Object{
	constructor(){
		this.parent = null;
		this._path = null;
	}
	get path(){
		if (this._path == null) {

			if (this.parent == null) {
				this._path = new Path();
			} else {
				// Maintain a Stack so that the order of the components
				// is reversed when they're added to the Path.
				// We're iterating up the hierarchy from the leaves/children to the root.
				var comps = [];

				var child = this;
//				Container container = child.parent as Container;
				var container = child.parent;

				while (container) {

					var namedChild = child;
					if (namedChild.name && namedChild.hasValidName) {
						comps.push(new Path.Component(namedChild.name));
					} else {
						comps.push(new Path.Component(container.content.indexOf(child)));
					}

					child = container;
//					container = container.parent as Container;
					container = container.parent;
				}

				this._path = new Path(comps);
			}

		}

		return this._path;
	}
	get rootContentContainer(){
		var ancestor = this;
		while (ancestor.parent) {
			ancestor = ancestor.parent;
		}
		return ancestor;
	}
	
	ResolvePath(path){
		if (path.isRelative) {
			var nearestContainer = this;
			//originally here, nearestContainer is a cast of this to a Container.
			//however, importing Container here creates a circular dep. Th best I can think of right now is to test the constructor name, which is likely to break in case of inheritance., but I don't think containers are extended.
			
			if (nearestContainer.constructor.name !== 'Container') {
				if (this.parent == null) console.warn("Can't resolve relative path because we don't have a parent");
				
				nearestContainer = this.parent;
				if (nearestContainer.constructor.name !== 'Container') console.warn("Expected parent to be a container");
				
				//Debug.Assert (path.components [0].isParent);
				path = path.tail;
			}
			
			return nearestContainer.ContentAtPath(path);
		} else {
			return this.rootContentContainer.ContentAtPath(path);
		}
	}
	ConvertPathToRelative(globalPath){
		var ownPath = this.path;

		var minPathLength = Math.min(globalPath.components.length, ownPath.components.length);
		var lastSharedPathCompIndex = -1;

		for (var i = 0; i < minPathLength; ++i) {
			var ownComp = ownPath.components[i];
			var otherComp = globalPath.components[i];

			if (ownComp.Equals(otherComp)) {
				lastSharedPathCompIndex = i;
			} else {
				break;
			}
		}

		// No shared path components, so just use global path
		if (lastSharedPathCompIndex == -1)
			return globalPath;

		var numUpwardsMoves = (ownPath.components.length-1) - lastSharedPathCompIndex;

		var newPathComps = [];

		for(var up = 0; up < numUpwardsMoves; ++up)
			newPathComps.push(Path.Component.ToParent());

		for (var down = lastSharedPathCompIndex + 1; down < globalPath.components.length; ++down)
			newPathComps.push(globalPath.components[down]);

		var relativePath = new Path(newPathComps);
		relativePath.isRelative = true;
		return relativePath;
	}
	CompactPathString(otherPath){
		var globalPathStr = null;
		var relativePathStr = null;
		
		if (otherPath.isRelative) {
			relativePathStr = otherPath.componentsString;
			globalPathStr = this.path.PathByAppendingPath(otherPath).componentsString;
		} 
		else {
			var relativePath = this.ConvertPathToRelative(otherPath);
			relativePathStr = relativePath.componentsString;
			globalPathStr = otherPath.componentsString;
		}

		if (relativePathStr.Length < globalPathStr.Length) 
			return relativePathStr;
		else
			return globalPathStr;
	}	
	Copy(){
		throw "Not Implemented";
	}
}