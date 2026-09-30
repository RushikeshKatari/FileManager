import React, { useState } from 'react';
import { X, Printer, CheckCircle2 } from 'lucide-react';
import { PhysicalFile, Shelf, Cupboard, Room, Officer, Attender } from '../../types';
import { QRCodeView } from './QRCodeView';
import {
  encodeFileKeepQR,
  encodeFileTakeQR,
  encodeLocationQR,
  encodeCupboardQR,
  encodeRoomQR,
  encodeOfficerQR,
  encodeAttenderQR,
} from '../../utils/qrUtils';
import { storage } from '../../services/storage';

interface PrintLabelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'FILE_DOUBLE_QR' | 'SHELF_LABELS' | 'CUPBOARD_LABEL' | 'ROOM_LABEL' | 'OFFICER_BADGE' | 'ATTENDER_BADGE';
  file?: PhysicalFile;
  shelf?: Shelf;
  cupboard?: Cupboard;
  room?: Room;
  officer?: Officer;
  attender?: Attender;
}

export const PrintLabelsModal: React.FC<PrintLabelsModalProps> = ({
  isOpen,
  onClose,
  type,
  file,
  shelf,
  cupboard,
  room,
  officer,
  attender,
}) => {
  const [printSuccess, setPrintSuccess] = useState(false);

  if (!isOpen) return null;

  const triggerNativePrint = () => {
    window.print();
    setPrintSuccess(true);
    setTimeout(() => setPrintSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
              Label Printing Preview
            </div>
            <h3 className="text-lg font-bold">
              {type === 'FILE_DOUBLE_QR' && `Physical File QR Labels: ${file?.id || 'File'}`}
              {type === 'ROOM_LABEL' && `Room Location QR Signboard: ${room?.name || 'Room'}`}
              {type === 'CUPBOARD_LABEL' && `Cupboard Barcode Label: ${cupboard?.code || 'Cupboard'}`}
              {type === 'SHELF_LABELS' && `Shelf Location Label: ${shelf?.code || 'Shelf'}`}
              {type === 'OFFICER_BADGE' && `Officer Official ID Badge: ${officer?.id || 'Officer'}`}
              {type === 'ATTENDER_BADGE' && `Attender Logistics Badge: ${attender?.id || 'Attender'}`}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={triggerNativePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print Label Sheet
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Print Content Preview */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 print:bg-white print:p-0">
          {printSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-800 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Print dialog sent to printer. Labels ready for physical attachment.
            </div>
          )}

          {/* Room QR Signboard */}
          {type === 'ROOM_LABEL' && room && (
            <div className="max-w-md mx-auto bg-white p-6 rounded-2xl border-2 border-indigo-600 shadow-md text-center">
              <div className="inline-block text-xs font-bold text-indigo-800 uppercase tracking-wider bg-indigo-100 px-3 py-1 rounded-full mb-3">
                ARCHIVAL ROOM DOOR BARCODE
              </div>

              <QRCodeView
                value={encodeRoomQR(room.id)}
                size={200}
                label={room.code}
                subLabel={room.name}
                showActions={false}
                className="border-0 shadow-none bg-transparent"
              />

              <div className="mt-5 p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl text-left space-y-1.5 text-xs text-slate-700">
                <div className="font-bold text-slate-900 text-sm mb-1">{room.name}</div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Location Code:</span>
                  <span className="font-mono font-bold text-slate-900">{room.code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Wing / Floor:</span>
                  <span className="font-bold text-slate-800">{room.building || 'Main Block'} • {room.floor || 'Ground'}</span>
                </div>
                {room.description && (
                  <div className="text-[11px] text-slate-500 pt-1 border-t border-indigo-200">
                    {room.description}
                  </div>
                )}
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">QR Payload:</span>
                  <span className="font-mono text-indigo-700 font-semibold">{encodeRoomQR(room.id)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Cupboard Barcode Label */}
          {type === 'CUPBOARD_LABEL' && cupboard && (
            <div className="max-w-md mx-auto bg-white p-6 rounded-2xl border-2 border-purple-600 shadow-md text-center">
              <div className="inline-block text-xs font-bold text-purple-800 uppercase tracking-wider bg-purple-100 px-3 py-1 rounded-full mb-3">
                CUPBOARD IDENTIFICATION BARCODE
              </div>

              <QRCodeView
                value={encodeCupboardQR(cupboard.code)}
                size={200}
                label={cupboard.code}
                subLabel={cupboard.name}
                showActions={false}
                className="border-0 shadow-none bg-transparent"
              />

              <div className="mt-5 p-3.5 bg-purple-50/70 border border-purple-200 rounded-xl text-left space-y-1.5 text-xs text-slate-700">
                <div className="font-bold text-slate-900 text-sm mb-1">{cupboard.name}</div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Room:</span>
                  <span className="font-bold text-slate-800">{storage.getRoomById(cupboard.roomId)?.name || cupboard.roomId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cupboard Code:</span>
                  <span className="font-mono font-bold text-slate-900">{cupboard.code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Capacity:</span>
                  <span className="font-semibold text-slate-800">{cupboard.capacity || 60} Physical Files</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">QR Payload:</span>
                  <span className="font-mono text-purple-700 font-semibold">{encodeCupboardQR(cupboard.code)}</span>
                </div>
              </div>
            </div>
          )}

          {/* 1. Double QR File Stickers */}
          {type === 'FILE_DOUBLE_QR' && file && (
            <div className="space-y-6">
              <div className="text-sm text-slate-600 bg-amber-50 border border-amber-200 p-3 rounded-lg">
                <span className="font-semibold text-amber-900">Physical Dual-QR Specification:</span>{' '}
                Print and adhere the <strong className="text-emerald-700">FRONT (KEEP/ADD)</strong> sticker on the top-front cover, and the <strong className="text-amber-700">BACK (TAKE/REMOVE)</strong> sticker on the back cover of docket folder.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:shadow-none print:border-0">
                {/* Front QR Sticker */}
                <div className="border-2 border-emerald-500 rounded-xl p-5 bg-gradient-to-b from-emerald-50/50 to-white flex flex-col items-center text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-bl-lg tracking-wider">
                    FRONT COVER
                  </div>
                  <div className="inline-block text-xs font-bold text-emerald-800 uppercase tracking-wide bg-emerald-100 px-3 py-0.5 rounded-full mb-3">
                    ACTION: KEEP / ADD / RECEIVE
                  </div>

                  <QRCodeView
                    value={encodeFileKeepQR(file.id)}
                    size={170}
                    label={file.id}
                    subLabel={file.name}
                    showActions={false}
                    className="border-0 shadow-none bg-transparent"
                  />

                  <div className="mt-4 pt-3 border-t border-emerald-200 w-full text-left space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">File Name:</span>
                      <span className="font-semibold text-slate-900">{file.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Department:</span>
                      <span className="font-semibold text-slate-900">{file.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Home Shelf:</span>
                      <span className="font-semibold text-slate-900">{storage.getLocationBreadcrumb(file.homeShelfId)}</span>
                    </div>
                  </div>

                  <div className="mt-3 text-[10px] text-slate-400 font-mono text-center">
                    Payload: FILE:KEEP:{file.id}
                  </div>
                </div>

                {/* Back QR Sticker */}
                <div className="border-2 border-amber-500 rounded-xl p-5 bg-gradient-to-b from-amber-50/50 to-white flex flex-col items-center text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-amber-600 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-bl-lg tracking-wider">
                    BACK COVER
                  </div>
                  <div className="inline-block text-xs font-bold text-amber-800 uppercase tracking-wide bg-amber-100 px-3 py-0.5 rounded-full mb-3">
                    ACTION: TAKE / REMOVE / RELEASE
                  </div>

                  <QRCodeView
                    value={encodeFileTakeQR(file.id)}
                    size={170}
                    label={file.id}
                    subLabel={file.name}
                    showActions={false}
                    className="border-0 shadow-none bg-transparent"
                  />

                  <div className="mt-4 pt-3 border-t border-amber-200 w-full text-left space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">File Name:</span>
                      <span className="font-semibold text-slate-900">{file.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Priority:</span>
                      <span className="font-semibold text-slate-900">{file.priority}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Scan Instruction:</span>
                      <span className="font-semibold text-amber-700">Scan this when removing from shelf/officer</span>
                    </div>
                  </div>

                  <div className="mt-3 text-[10px] text-slate-400 font-mono text-center">
                    Payload: FILE:TAKE:{file.id}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. Shelf Labels */}
          {type === 'SHELF_LABELS' && shelf && (
            <div className="max-w-md mx-auto bg-white p-6 rounded-2xl border-2 border-blue-500 shadow-md text-center">
              <div className="inline-block text-xs font-bold text-blue-800 uppercase tracking-wider bg-blue-100 px-3 py-1 rounded-full mb-3">
                SHELF LOCATION BARCODE
              </div>

              <QRCodeView
                value={encodeLocationQR(shelf.code)}
                size={200}
                label={shelf.code}
                subLabel={shelf.name}
                showActions={false}
                className="border-0 shadow-none bg-transparent"
              />

              <div className="mt-5 p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-left space-y-1.5 text-xs text-slate-700">
                <div className="font-bold text-slate-900 text-sm mb-1">Location Hierarchy</div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Full Breadcrumb:</span>
                  <span className="font-bold text-blue-900">{storage.getLocationBreadcrumb(shelf.id)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Shelf ID Code:</span>
                  <span className="font-mono font-bold text-slate-900">{shelf.code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">QR Payload:</span>
                  <span className="font-mono text-slate-600">{encodeLocationQR(shelf.code)}</span>
                </div>
              </div>
            </div>
          )}

          {/* 3. Officer Badge */}
          {type === 'OFFICER_BADGE' && officer && (
            <div className="max-w-sm mx-auto bg-white rounded-2xl border-2 border-indigo-600 shadow-lg p-6 text-center">
              <div className="flex items-center justify-between border-b border-indigo-100 pb-3 mb-4">
                <span className="text-xs font-extrabold text-indigo-700 tracking-wider uppercase">
                  OFFICIAL OFFICER BADGE
                </span>
                <span className="font-mono text-xs font-bold text-slate-500">{officer.id}</span>
              </div>

              <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-700 mx-auto flex items-center justify-center font-bold text-xl mb-3 border-2 border-indigo-300">
                {officer.name.split(' ').slice(1).map((n) => n[0]).join('') || officer.name.slice(0, 2)}
              </div>

              <h4 className="text-lg font-bold text-slate-900">{officer.name}</h4>
              <div className="text-xs font-semibold text-indigo-600 mb-1">{officer.designation}</div>
              <div className="text-xs text-slate-500">{officer.department}</div>

              <div className="my-4 pt-2 flex justify-center">
                <QRCodeView
                  value={encodeOfficerQR(officer.id)}
                  size={150}
                  label={officer.id}
                  subLabel="Officer Verification QR"
                  showActions={false}
                  className="border border-slate-200"
                />
              </div>

              <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <div>Desk: <span className="font-semibold text-slate-800">{officer.deskNumber}</span></div>
                <div>Attenders scan this badge when delivering or collecting files.</div>
              </div>
            </div>
          )}

          {/* 4. Attender Badge */}
          {type === 'ATTENDER_BADGE' && attender && (
            <div className="max-w-sm mx-auto bg-white rounded-2xl border-2 border-emerald-600 shadow-lg p-6 text-center">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-3 mb-4">
                <span className="text-xs font-extrabold text-emerald-700 tracking-wider uppercase">
                  LOGISTICS ATTENDER BADGE
                </span>
                <span className="font-mono text-xs font-bold text-slate-500">{attender.id}</span>
              </div>

              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center font-bold text-xl mb-3 border-2 border-emerald-300">
                {attender.name.slice(0, 2).toUpperCase()}
              </div>

              <h4 className="text-lg font-bold text-slate-900">{attender.name}</h4>
              <div className="text-xs font-semibold text-emerald-600 mb-1">Custody & Physical Transfer</div>
              <div className="text-xs text-slate-500">{attender.assignedZone}</div>

              <div className="my-4 pt-2 flex justify-center">
                <QRCodeView
                  value={encodeAttenderQR(attender.id)}
                  size={150}
                  label={attender.id}
                  subLabel="Attender Verification QR"
                  showActions={false}
                  className="border border-slate-200"
                />
              </div>

              <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <div>Shift: <span className="font-semibold text-slate-800">{attender.shift}</span></div>
                <div>Authorized to move physical files between shelves and officers.</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-700 hover:bg-slate-200 text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={triggerNativePrint}
            className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print Now
          </button>
        </div>
      </div>
    </div>
  );
};
