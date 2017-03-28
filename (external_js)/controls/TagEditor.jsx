/**
 * @author Jonathan Hearn <jonathan.hearn@ajptechnical.com>
 * @created 2017-01-18
 */
 
function inArray(needle, haystack)
{
	for (var i in haystack)
		if (haystack[i] == needle) return true;
	return false;
}

function TagEditor(parent, items, initial)
{
	var obj = {
		parent: parent,
		items: items,
		initial: initial,
		tags: [],
		grp: undefined,
		ddl: undefined,
		edit: undefined,
	};
	return (function(o){
		o.grp = o.parent.add("group");
		o.grp.orientation = "row";
		o.grp.alignment = ['fill', 'middle'];
		o.grp.aignChildren = ['fill', 'middle'];
		o.grp.id = 1;
		o.ddl = o.grp.add("dropdownlist", undefined, o.items);
		o.edit = o.grp.add("edittext");
		o.edit.preferredSize = [400, 23];
		
		o.ddl.onChange = (function(___meee){
			return function()
			{
				if (___meee.ddl.selection)
				{
					___meee.addTag(___meee.ddl.selection.text);
					___meee.ddl.selection = null;
				}
			};
		})(o);
		
		o.edit.onChange = (function(___meee) {
			return function()
			{
				try
				{
					___meee.addTags(___meee.edit.text.split(","));
				}
				catch(err)
				{
					___meee.edit.text = o.tags;
				}
			};
		})(o);
		
		o.addTag = (function(___meee) {
			return function(tag)
			{
				if (!inArray(tag, ___meee.tags))
				{
					___meee.tags.push(tag);
					___meee.edit.text = ___meee.tags;
					___meee.propagateOnChange();
				}
			};
		})(o);
		
		o.addTags = (function(___meee) {
			return function(new_tags)
			{
				___meee.tags = [];
				for (var i in new_tags)
					if (inArray(new_tags[i], ___meee.items))
						___meee.tags.push(new_tags[i]);
				___meee.edit.text = ___meee.tags;
				___meee.propagateOnChange();
			};
		})(o);
		
		o.removeTag = (function(___meee) {
			return function(tag) {
				if (tag in ___meee.tags)
					___meee.tags.remove(tag);
				___meee.edit.text = ___meee.tags;
				___meee.propagateOnChange();
			};
		})(o);
		
		o.propagateOnChange = (function(___meee) {
			return function() {
				if (___meee.onChange != undefined)
					___meee.onChange(___meee.tags);
			};
		})(o);
	
		if (o.initial)
			o.addTags(o.initial);
	
		return o;
	})(obj);
};
