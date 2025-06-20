export function processContent(rawHtml) {
  const allowedTags = [
    'b',
    'i',
    'u',
    'a',
    'br',
    'p',
    'span',
    'div',
    'ul',
    'ol',
    'li',
    'strong',
    'em'
  ];
  const allowedAttrs = [
    'href',
    'target',
    'class',
    'style',
    'data-mention-id'
  ];
  rawHtml = DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: allowedAttrs
  });

  const isOnlyUrl = rawHtml.trim().match(/^(https?:\/\/[^\s]+)$/);
  const link = isOnlyUrl ? rawHtml.trim() : null;

  const yt =
    link &&
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/.exec(link);
  const vi = link && /vimeo\.com\/(\d+)/.exec(link);
  const loom = link && /loom\.com\/share\/([a-zA-Z0-9]+)/.exec(link);

  if (yt) {
    return `
    <a class="block mb-2" href="https://www.youtube.com/watch?v=${yt[1]}" target="_blank" style="color: blue; text-decoration: underline;">https://www.youtube.com/watch?v=${yt[1]}</a>
    <iframe class="!w-full" width="560" height="315" src="https://www.youtube.com/embed/${yt[1]}" frameborder="0" allow="autoplay; encrypted-media"></iframe>`;
  } else if (vi) {
    return `
    <a class="block mb-2" href="https://player.vimeo.com/video/${vi[1]}" target="_blank" style="color: blue; text-decoration: underline;">https://player.vimeo.com/video/${vi[1]}</a>
    <iframe class="!w-full" width="560" height="315" src="https://player.vimeo.com/video/${vi[1]}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture"></iframe>`;
  } else if (loom) {
    return `
    <a class="block mb-2" href="https://www.loom.com/share/${loom[1]}" target="_blank" style="color: blue; text-decoration: underline;">https://www.loom.com/share/${loom[1]}</a>
    <iframe class="!w-full" width="560" height="315" src="https://www.loom.com/embed/${loom[1]}" frameborder="0" allowfullscreen></iframe>`;
  } else if (link) {
    return `<a class="block mb-2" href="${link}" target="_blank" style="color: blue; text-decoration: underline;">${link}</a>`;
  }

  const container = document.createElement("div");
  container.innerHTML = rawHtml;

  container.querySelectorAll("a").forEach((a) => {
    const href = a.href;

    const ytMatch =
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/.exec(href);
    const viMatch = /vimeo\.com\/(\d+)/.exec(href);
    const loomMatch = /loom\.com\/share\/([a-zA-Z0-9]+)/.exec(href);

    let iframeHTML = null;

    if (ytMatch) {
      iframeHTML = `
      <a class="block mb-2" href="https://www.youtube.com/watch?v=${ytMatch[1]}" target="_blank" style="color: blue; text-decoration: underline;">https://www.youtube.com/watch?v=${ytMatch[1]}</a>
      <iframe class="!w-full" width="300" height="315" src="https://www.youtube.com/embed/${ytMatch[1]}" frameborder="0" allow="autoplay; encrypted-media"></iframe>`;
    } else if (viMatch) {
      iframeHTML = `
      <a class="block mb-2" href="https://player.vimeo.com/video/${viMatch[1]}"target="_blank" style="color: blue; text-decoration: underline;">https://player.vimeo.com/video/${viMatch[1]}</a>
      <iframe class="!w-full" width="300" height="315" src="https://player.vimeo.com/video/${viMatch[1]}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture"></iframe>`;
    } else if (loomMatch) {
      iframeHTML = `
      <a class="block mb-2" href="https://www.loom.com/share/${loomMatch[1]}" target="_blank" style="color: blue; text-decoration: underline;">https://www.loom.com/share/${loomMatch[1]}</a>
      <iframe class="!w-full" width="300" height="315" src="https://www.loom.com/embed/${loomMatch[1]}" frameborder="0" allowfullscreen></iframe>`;
    }

    if (iframeHTML) {
      a.classList.add("video-link");
      a.setAttribute("target", "_blank");

      const tooltipWrapper = document.createElement("span");
      tooltipWrapper.classList.add("video-tooltip-wrapper");

      const tooltip = document.createElement("span");
      tooltip.classList.add("video-tooltip");
      tooltip.innerHTML = iframeHTML;

      a.parentNode.insertBefore(tooltipWrapper, a);
      tooltipWrapper.appendChild(a);
      tooltipWrapper.appendChild(tooltip);
    } else {
      a.setAttribute("target", "_blank");
      a.style.color = "blue";
      a.style.textDecoration = "underline";
    }
  });

  return DOMPurify.sanitize(container.innerHTML, {
    ALLOWED_TAGS: [...allowedTags, 'iframe'],
    ALLOWED_ATTR: [
      ...allowedAttrs,
      'width',
      'height',
      'allow',
      'allowfullscreen',
      'frameborder'
    ]
  });
}
