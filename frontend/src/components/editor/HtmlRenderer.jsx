import React, { useEffect, useRef } from "react";
import GithubSlugger from "github-slugger";

const editorStyles = `
  [&_h1]:text-4xl      [&_h1]:font-black  [&_h1]:text-on-surface [&_h1]:mb-4  [&_h1]:mt-8
  [&_h2]:text-3xl      [&_h2]:font-bold   [&_h2]:text-on-surface [&_h2]:mb-3  [&_h2]:mt-7
  [&_h3]:text-2xl      [&_h3]:font-bold   [&_h3]:text-on-surface [&_h3]:mb-3  [&_h3]:mt-6
  [&_h4]:text-xl       [&_h4]:font-bold   [&_h4]:text-on-surface [&_h4]:mb-2  [&_h4]:mt-5
  [&_h5]:text-lg       [&_h5]:font-bold   [&_h5]:text-on-surface [&_h5]:mb-2  [&_h5]:mt-4
  [&_h6]:text-base     [&_h6]:font-bold   [&_h6]:text-on-surface/70 [&_h6]:mb-2 [&_h6]:mt-4
  [&_p]:text-on-surface [&_p]:leading-relaxed [&_p]:mb-3
  [&_strong]:font-bold [&_strong]:text-on-surface
  [&_em]:italic        [&_em]:text-on-surface-variant
  [&_u]:underline      [&_u]:underline-offset-2
  [&_s]:line-through   [&_s]:text-on-surface-variant

  [&_blockquote]:border-l-[3px]
  [&_blockquote]:border-primary
  [&_blockquote]:bg-primary-fixed
  [&_blockquote]:pl-5               [&_blockquote]:py-4    [&_blockquote]:pr-5
  [&_blockquote]:my-7               [&_blockquote]:rounded-r-2xl
  [&_blockquote]:italic             [&_blockquote]:text-on-surface-variant
  [&_blockquote]:text-[1.02rem]     [&_blockquote]:leading-relaxed
  [&_blockquote_p]:mb-0             [&_blockquote_p]:text-on-surface-variant

  [&_ul]:list-disc     [&_ul]:list-outside [&_ul]:pl-8 [&_ul]:my-3
  [&_ol]:list-decimal  [&_ol]:list-outside [&_ol]:pl-8 [&_ol]:my-3
  [&_li]:text-on-surface [&_li]:my-1
  [&_li_p]:inline      [&_li_p]:m-0

  [&_pre]:bg-surface-high
  [&_pre]:text-on-surface
  [&_pre]:rounded-2xl        [&_pre]:my-6
  [&_pre]:overflow-hidden
  [&_pre]:border             [&_pre]:border-primary/15
  [&_pre]:shadow-sm
  [&_pre_code]:block         [&_pre_code]:p-5
  [&_pre_code]:font-mono     [&_pre_code]:text-sm
  [&_pre_code]:leading-relaxed
  [&_pre_code]:overflow-x-auto
  [&_pre_code]:bg-transparent [&_pre_code]:text-on-surface

  [&_code]:bg-primary-fixed  [&_code]:px-1.5   [&_code]:py-0.5
  [&_code]:rounded-md        [&_code]:font-mono [&_code]:text-[0.82em]
  [&_code]:text-primary      [&_code]:border   [&_code]:border-primary/20

  [&_a]:text-primary   [&_a]:underline [&_a]:underline-offset-2
  [&_hr]:border-t-2    [&_hr]:border-dashed [&_hr]:border-primary/20 [&_hr]:my-8
  [&_img]:w-full       [&_img]:rounded-2xl [&_img]:my-4
  [&_table]:w-full     [&_table]:border-collapse [&_table]:my-4
  [&_th]:border        [&_th]:border-primary/10 [&_th]:bg-surface-low
    [&_th]:px-3        [&_th]:py-2 [&_th]:text-left [&_th]:text-xs [&_th]:font-bold
  [&_td]:border        [&_td]:border-primary/10 [&_td]:px-3 [&_td]:py-2 [&_td]:text-sm
`;

const HtmlRenderer = ({ content, className = "" }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const slugger = new GithubSlugger();
    ref.current.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((el) => {
      el.id = slugger.slug(el.textContent || "");
    });
  }, [content]);

  return (
    <div
      ref={ref}
      className={`${editorStyles} ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

export default HtmlRenderer;
