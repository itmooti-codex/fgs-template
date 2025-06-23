import { setPendingFile, setFileTypeCheck } from '../features/uploads/handlers.js';
import { micIcon } from '../ui/emoji.js';
FilePond.registerPlugin(
  FilePondPluginFileValidateType,
  FilePondPluginImagePreview,
  FilePondPluginMediaPreview,
  FilePondPluginFilePoster
);

export function initFilePond() {
  document.querySelectorAll(".upload-section").forEach((section) => {
    const inputElement = section.querySelector(".file-input");
    const dropArea = section.querySelector("#dropArea");
    const recordBtn = section.querySelector(".recordBtn");
    const canvas = section.querySelector(".waveform");
    if (!inputElement || !dropArea || !canvas) return;
    const ctx = canvas.getContext("2d");
    
    const pond = FilePond.create(inputElement, {
      allowReplace: true,
      allowBrowse: true,
      allowDrop: false,
      allowPaste: false,
      allowImagePreview: true,
      allowAudioPreview: true,
      allowVideoPreview: true,
      allowFilePoster: true,
      allowMediaPreview: true,
      server: null,
      acceptedFileTypes: [
        "image/*",
        "audio/*",
        "video/webm",
        "audio/webm",
        "video/*",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ]
    });

    ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
      dropArea.addEventListener(eventName, (e) => e.preventDefault());
    });

    ["dragenter", "dragover"].forEach((eventName) => {
      dropArea.addEventListener(eventName, () => dropArea.classList.add("dragover"));
    });

    ["dragleave", "drop"].forEach((eventName) => {
      dropArea.addEventListener(eventName, () => dropArea.classList.remove("dragover"));
    });
    pond.on('init', () => {
      dropArea.addEventListener("drop", (e) => {
        e.preventDefault();
        dropArea.classList.remove("dragover");
        const files = e.dataTransfer.files;
       
          pond.addFile(files[0]);
        
      });
    });


    pond.on("addfile", (error, fileItem) => {
      if (error) return;
      const file = fileItem.file;
      const type = file.type;
      const name = file.name;
      const isVideo = type.startsWith("video/");
      const isAudio = type.startsWith("audio/");
      if (!isVideo && !isAudio) return;

      const testEl = document.createElement(isVideo ? "video" : "audio");
      if (!testEl.canPlayType(type)) {
        const msg = document.createElement("p");
        msg.textContent = `${name} isn’t supported for in-browser preview on iOS.`;
        msg.style.color = "#c00";
        const fallback = inputElement.closest(".upload-section");
        fallback?.appendChild(msg);
        return;
      }

      const previewWrapper = inputElement.closest(".upload-section")?.querySelector(".filepond--file-wrapper");
      if (!previewWrapper) return;

      const mediaEl = document.createElement(isVideo ? "video" : "audio");
      mediaEl.src = URL.createObjectURL(file);
      mediaEl.controls = true;
      mediaEl.preload = "metadata";
      mediaEl.classList.add("media-preview");

      if (isVideo) {
        mediaEl.setAttribute("playsinline", "");
        mediaEl.setAttribute("webkit-playsinline", "");
        mediaEl.setAttribute("x5-playsinline", "");
      }

      previewWrapper.appendChild(mediaEl);
    });

    pond.on("removefile", () => {
      setPendingFile(null);
      setFileTypeCheck("");
      inputElement.value = "";
      canvas.style.display = "none";
      const cancelBtn = section.querySelector(".cancelRecordingBtn");
      if (cancelBtn) cancelBtn.remove();
    });

    const recorder = new MicRecorder({ bitRate: 128 });
    let isRecording = false;
    let audioContext, analyser, dataArray, source, animationId, mediaStream;

    const drawWaveform = () => {
      if (!analyser) return;
      analyser.getByteTimeDomainData(dataArray);
      ctx.fillStyle = "#f0f0f0";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#0963D8";
      ctx.beginPath();

      const sliceWidth = canvas.width / analyser.frequencyBinCount;
      let x = 0;

      for (let i = 0; i < analyser.frequencyBinCount; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      animationId = requestAnimationFrame(drawWaveform);
    };

    if (recordBtn) {
      recordBtn.addEventListener("click", () => {
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

        if (!isRecording) {
          pond.setOptions({ allowBrowse: false, allowDrop: false, allowPaste: false });
          inputElement.disabled = true;
          canvas.style.display = "block";

          let cancelBtn = section.querySelector(".cancelRecordingBtn");
          if (!cancelBtn) {
            cancelBtn = document.createElement("div");
            cancelBtn.className = "cancelRecordingBtn";
            cancelBtn.innerHTML = `
              <div div class="inline-flex group cursor-pointer justify-start items-center gap-3" >
                <div class="px-3 py-2 rounded border border-1 border-offset-[-1px] border-red-600 flex justify-start items-center gap-2  group-hover:bg-[#FDD0D1] group-hover:border-[#FDD0D1]" transition-all>
                  <div data-property-1="ph:stop-fill" class="w-3 h-3 relative overflow-hidden">
                    <div class="w-2.5 h-2.5 left-[1px] top-[1px] absolute bg-red-600 "></div>
                  </div>
                  <div class="text-center justify-start text-red-600 text-xs font-normal font-['Inter'] leading-none ">Stop Recording</div>
                </div>
            </div >
`;

            const canvasElement = section.querySelector(".canvasWaveform");
            canvasElement.insertAdjacentElement("beforebegin", cancelBtn);

            cancelBtn.addEventListener("click", () => {
              if (animationId) cancelAnimationFrame(animationId);
              canvas.style.display = "none";
              mediaStream?.getTracks().forEach((track) => track.stop());

              if (isSafari && recordBtn._safariRecorder) {
                recordBtn._safariRecorder.stop();
                delete recordBtn._safariRecorder;
              
                isRecording = false;
              } else {
                recorder.stop().getMp3().then(([buffer, blob]) => {
                  isRecording = false;
                

                  const file = new File(buffer, "recorded-audio.mp3", {
                    type: blob.type,
                    lastModified: Date.now(),
                  });

                  const cancelButton = section.querySelector(".cancelRecordingBtn");
                  if (cancelButton) cancelButton.remove();

                  pond.setOptions({ allowBrowse: true, allowDrop: false, allowPaste: false });
                  inputElement.disabled = false;

                  pond.addFile(file).then(() => {
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(file);
                    inputElement.files = dataTransfer.files;
                    setPendingFile(file);
                    setFileTypeCheck("Audio");

                    const nativeEvent = new Event("change", { bubbles: true });
                    inputElement.dispatchEvent(nativeEvent);
                    $(inputElement).trigger("change");
                  });
                }).catch((e) => console.error(e));
              }
            });
          }

          const audioConstraints = isSafari ? { audio: {} } : { audio: { sampleRate: 44100 } };

          navigator.mediaDevices.getUserMedia(audioConstraints).then((stream) => {
            mediaStream = stream;
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            analyser.fftSize = 2048;
            dataArray = new Uint8Array(analyser.frequencyBinCount);

            drawWaveform();

            if (isSafari) {
              const recordedChunks = [];
              const safariRecorder = new MediaRecorder(stream);
              safariRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) recordedChunks.push(event.data);
              };
              safariRecorder.onstop = () => {
                const blob = new Blob(recordedChunks, { type: "audio/mp3" });
                const file = new File([blob], "recorded-audio.mp3", {
                  type: "audio/mp3",
                  lastModified: Date.now(),
                });

                canvas.style.display = "none";
                mediaStream?.getTracks().forEach((track) => track.stop());

                const cancelBtn = section.querySelector(".cancelRecordingBtn");
                if (cancelBtn) cancelBtn.remove();

                pond.setOptions({ allowBrowse: true, allowDrop: false, allowPaste: false });
                inputElement.disabled = false;

                pond.addFile(file).then(() => {
                  const dataTransfer = new DataTransfer();
                  dataTransfer.items.add(file);
                  inputElement.files = dataTransfer.files;
                  setPendingFile(file);
                  setFileTypeCheck("Audio");

                  const nativeEvent = new Event("change", { bubbles: true });
                  inputElement.dispatchEvent(nativeEvent);
                  $(inputElement).trigger("change");
                });
              };

              safariRecorder.start();
              isRecording = true;
              recordBtn._safariRecorder = safariRecorder;
            } else {
              recorder.start().then(() => {
                isRecording = true;
              });
            }
          }).catch((e) => {
            console.error("Mic access failed:", e.name, e.message);
           
            inputElement.disabled = false;
            canvas.style.display = "none";
          });
        }
      });
    }
  });
}

export function resumeAudioContext() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  if (ctx.state === "suspended") ctx.resume();
}
