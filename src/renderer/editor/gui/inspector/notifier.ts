import { Nullable } from "../../../../shared/types";

import { undoRedo } from "../../tools/undo-redo";

interface _InspectorNotification {
    /**
     * Defines the reference to the object to listen changes.
     */
    object: any;
    /**
     * Defines the callback called on the object has been changed and notified.
     */
    callback: () => void;

    /**
     * Defines the reference to the caller.
     * @hidden
     */
    caller: any;

    /**
     * @hidden
     */
     _timeoutId: Nullable<number>;
}

export interface IInspectorNotifierChangeOptions {
    /**
     * Defines the name of the property that has been changed.
     */
    property?: string;
    /**
     * Defines the old value of the property.
     */
    oldValue?: any;
    /**
     * Defines the new value of the property.
     */
    newValue?: any;
    /**
     * Defines the callback called on the undo/redo is called.
     */
    onUndoRedo?: () => void;

    /**
     * Defines the caller that notifies the change. This is typically used to don't listen themselves.
     */
    caller?: any;
    /**
     * Defines the optional time in milliseconds to wait before notifying changes.
     */
    waitMs?: number;
}

export class InspectorNotifier {
    private static _NotificationId: number = 0;
    private static _Notifications: _InspectorNotification[] = [];

    /**
     * Notifies the inspectors that the given object has been notified.
     * @param object defines the reference to the object that has been changed.
     * @param caller defines the caller that notifies the change. This is typically used to don't listen themselves;
     */
    public static NotifyChange<T>(object: T, options: IInspectorNotifierChangeOptions = { }): void {
        // Undo / redo?
        if (options.property && options.oldValue !== undefined && options.newValue !== undefined) {
            undoRedo.push({
                common: () => {
                    this.NotifyChange(object, { caller: this });
                    options.onUndoRedo?.();
                },
                undo: () => object[options.property!] = options.oldValue,
                redo: () => object[options.property!] = options.newValue,
            });
        }

        // Do not call ourself
        if (options.caller === this) {
            return;
        }

        // Notify!
        this._Notifications.forEach((n) => {
            if (n.caller === options.caller) {
                return;
            }

            let effectiveObject = n.object;

            if (typeof(n.object) === "function") {
                effectiveObject = n.object();
            }

            if (effectiveObject !== object) {
                return;
            }

            if (options.waitMs && options.waitMs > 0) {
                if (n._timeoutId !== null) {
                    clearTimeout(n._timeoutId);
                    n._timeoutId = null;
                }

                n._timeoutId = setTimeout(() => n.callback(), options.waitMs) as any;
            } else {
                n.callback();
            }
        })
    }

    /**
     * Registers the given callback when the given object has been changed.
     * @param object defines the reference to the object to listen changes.
     * @param callback defines the callback called on the object has been changed and notified.
     * @returns the id of the nofifier. Should be kept in order to unregister.
     */
    public static Register<T>(caller: any, object: T | (() => void), callback: () => void): number {
        this._NotificationId++;

        this._Notifications.push({ object, callback, caller: caller, _timeoutId: null });
        return this._NotificationId;
    }

    /**
     * Unregisters the notifier identified by the given Id.
     * @param caller defines the reference to the original caller.
     */
    public static Unregister(caller: any): void {
        let index = -1;

        while ((index = this._Notifications.findIndex((n) => n.caller === caller)) !== -1) {
            this._Notifications.splice(index, 1);
        }
    }
}
