const Applet = imports.ui.applet;
const Gio = imports.gi.Gio;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const Clutter = imports.gi.Clutter;
const St = imports.gi.St;
const Util = imports.misc.util;
const PopupMenu = imports.ui.popupMenu;
const Calendar = imports.ui.calendar;
const UPowerGlib = imports.gi.UPowerGlib;
const PanelMenu = imports.ui.panelMenu;
const Main = imports.ui.main;
const Gtk = imports.gi.Gtk;
const GLib = imports.gi.GLib;
const Cinnamon = imports.gi.Cinnamon;


const INHIBIT_TT = "Currently preventing screen-saver";
const ALLOW_TT = "Currently allowing screen-saver";

disp_state = 0; // inhibit off initially

function MyApplet(orientation) {
    this._init(orientation);
}


MyApplet.prototype = {
    __proto__: Applet.IconApplet.prototype,

    _init: function(orientation) {        
        Applet.TextIconApplet.prototype._init.call(this, orientation);
        
        try {                 
            this.set_applet_icon_symbolic_name('video-display-symbolic');
            this.set_applet_tooltip(ALLOW_TT);
            this._orientation = orientation;
        }
        catch (e) {
            global.logError(e);
        }
    },

    on_applet_clicked: function(event) {
        switch (disp_state) {
            case 0:
                this.set_applet_icon_symbolic_name('dialog-error-symbolic');
                this.set_applet_tooltip(INHIBIT_TT);
                disp_state = 1;
                spawnCommandLineNoError("gnome-screensaver-command --exit");
                spawnCommandLineNoError("xscreensaver-command -exit");
                break;
            case 1:
                this.set_applet_icon_symbolic_name('video-display-symbolic');
                this.set_applet_tooltip(ALLOW_TT);
                disp_state = 0;
                spawnCommandLineNoError("gnome-screensaver");
                spawnCommandLineNoError("xscreensaver -nosplash");
                break;
        }
    },
    
    on_orientation_changed: function (orientation) {
        this._orientation = orientation;
        this._initContextMenu();
    }
};


function spawnCommandLineNoError(command_line) {
    try {
        let [success, argv] = GLib.shell_parse_argv(command_line);
        Main.Util.trySpawn(argv);
    } catch (err) {}
}    


function main(metadata, orientation) {  
    let myApplet = new MyApplet(orientation);
    return myApplet;      
}
