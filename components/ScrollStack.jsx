import React, { useLayoutEffect, useRef, useCallback, useEffect } from 'react';
import Lenis from 'lenis';
import './ScrollStack.css';

export const ScrollStackItem = ({ children, itemClassName = '' }) => (
    <div className={`scroll-stack-card ${itemClassName}`.trim()}>{children}</div>
);

const ScrollStack = ({
    children,
    className = '',
    itemDistance = 150,
    itemScale = 0.03,
    itemStackDistance = 45,
    stackPosition = '10%',
    scaleEndPosition = '5%',
    baseScale = 0.85,
    scaleDuration = 0.5,
    rotationAmount = 0,
    blurAmount = 0,
    useWindowScroll = false,
    onStackComplete
}) => {
    const scrollerRef = useRef(null);
    const stackCompletedRef = useRef(false);
    const animationFrameRef = useRef(null);
    const lenisRef = useRef(null);
    const cardsRef = useRef([]);
    const cardOffsetsRef = useRef([]);
    const isUpdatingRef = useRef(false);

    const calculateProgress = useCallback((scrollTop, start, end) => {
        if (scrollTop < start) return 0;
        if (scrollTop > end) return 1;
        return (scrollTop - start) / (end - start);
    }, []);

    const parsePercentage = useCallback((value, containerHeight) => {
        if (typeof value === 'string' && value.includes('%')) {
            return (parseFloat(value) / 100) * containerHeight;
        }
        return parseFloat(value);
    }, []);

    const getScrollData = useCallback(() => {
        if (useWindowScroll) {
            return {
                scrollTop: window.scrollY,
                containerHeight: window.innerHeight,
            };
        } else {
            const scroller = scrollerRef.current;
            return {
                scrollTop: scroller?.scrollTop || 0,
                containerHeight: scroller?.clientHeight || 0,
            };
        }
    }, [useWindowScroll]);

    const updateCardTransforms = useCallback(() => {
        if (!cardsRef.current.length || isUpdatingRef.current) return;

        isUpdatingRef.current = true;

        const { scrollTop, containerHeight } = getScrollData();
        const stackPositionPx = parsePercentage(stackPosition, containerHeight);
        const scaleEndPositionPx = parsePercentage(scaleEndPosition, containerHeight);

        const endElement = useWindowScroll
            ? document.querySelector('.scroll-stack-end')
            : scrollerRef.current?.querySelector('.scroll-stack-end');

        // Static end position
        const endElementTop = endElement ? (endElement.getBoundingClientRect().top + (useWindowScroll ? window.scrollY : scrollerRef.current.scrollTop) - (endElement.style.transform ? parseFloat(endElement.style.transform.match(/translate3d\(.*,\s*(.*)px,\s*.*\)/)?.[1] || 0) : 0)) : 0;
        // Simplify: just use the offset ref for cards

        cardsRef.current.forEach((card, i) => {
            if (!card) return;

            const cardStaticTop = cardOffsetsRef.current[i] || 0;
            const cardHeight = card.offsetHeight;
            if (!cardStaticTop) return;

            // Header/Subnav allowance (can be passed as prop later)
            const topMargin = stackPositionPx + (itemStackDistance * i);

            // Adjust trigger for smoother entry
            const triggerStart = cardStaticTop - containerHeight;
            const triggerEnd = cardStaticTop - topMargin;

            // Pinning logic
            const pinStart = cardStaticTop - topMargin;
            let pinEnd = (endElementTop || (cardStaticTop + 2000)) - containerHeight / 1.5;

            // Progress for scaling/blur
            const scaleProgress = calculateProgress(scrollTop, pinStart, pinStart + containerHeight);

            const targetScale = baseScale + i * itemScale;
            // Use a smoother power function for scaling
            const scale = 1 - Math.pow(scaleProgress, 1.5) * (1 - targetScale);
            const rotation = rotationAmount ? i * rotationAmount * scaleProgress : 0;

            let blur = 0;
            if (blurAmount) {
                let topCardIndex = 0;
                for (let j = 0; j < cardsRef.current.length; j++) {
                    const jStaticTop = cardOffsetsRef.current[j] || 0;
                    const jTriggerStart = jStaticTop - stackPositionPx - itemStackDistance * j;
                    if (scrollTop >= jTriggerStart) {
                        topCardIndex = j;
                    }
                }

                if (i < topCardIndex) {
                    const depthInStack = topCardIndex - i;
                    blur = Math.min(8, depthInStack * blurAmount);
                }
            }

            let translateY = 0;
            const isPinned = scrollTop >= pinStart && scrollTop <= pinEnd;

            if (isPinned) {
                translateY = scrollTop - cardStaticTop + topMargin;
            } else if (scrollTop > pinEnd) {
                translateY = pinEnd - cardStaticTop + topMargin;
            }

            // Accessibility Fix: If the card is too tall to fit in the remaining viewport space,
            // we should allow it to scroll away earlier or adjust translateY so the bottom isn't cut.
            // However, a simpler UX fix is to ensure the stack-end element is far enough.

            const transform = `translate3d(0, ${translateY}px, 0) scale(${scale}) rotate(${rotation}deg)`;
            const filter = blur > 0 ? `blur(${blur}px)` : '';

            card.style.transform = transform;
            card.style.filter = filter;
            card.style.zIndex = i;
            card.style.opacity = scrollTop > pinEnd + 200 ? Math.max(0, 1 - (scrollTop - pinEnd - 200) / 400) : 1;

            if (i === cardsRef.current.length - 1) {
                const isInView = scrollTop >= pinStart && scrollTop <= pinEnd;
                if (isInView && !stackCompletedRef.current) {
                    stackCompletedRef.current = true;
                    onStackComplete?.();
                } else if (!isInView && stackCompletedRef.current) {
                    stackCompletedRef.current = false;
                }
            }
        });

        isUpdatingRef.current = false;
    }, [
        itemScale,
        itemStackDistance,
        stackPosition,
        scaleEndPosition,
        baseScale,
        rotationAmount,
        blurAmount,
        useWindowScroll,
        onStackComplete,
        calculateProgress,
        parsePercentage,
        getScrollData
    ]);

    const handleScroll = useCallback(() => {
        updateCardTransforms();
    }, [updateCardTransforms]);

    const refreshOffsets = useCallback(() => {
        const scroller = scrollerRef.current;

        // Temporarily clear transforms to measure static offsets
        cardsRef.current.forEach(card => {
            card.style.transform = 'none';
        });

        cardOffsetsRef.current = cardsRef.current.map(card => {
            if (useWindowScroll) {
                const rect = card.getBoundingClientRect();
                return rect.top + window.scrollY;
            } else {
                return card.offsetTop;
            }
        });

        // Restore transforms immediately
        updateCardTransforms();
    }, [useWindowScroll, updateCardTransforms]);

    useEffect(() => {
        const handleResize = () => refreshOffsets();
        window.addEventListener('resize', handleResize);
        // Initial measurement after a small delay to ensure content is settled
        const timer = setTimeout(refreshOffsets, 100);
        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(timer);
        };
    }, [refreshOffsets]);

    const setupLenis = useCallback(() => {
        if (useWindowScroll) {
            const lenis = new Lenis({
                duration: 1.2,
                easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                smoothWheel: true,
                wheelMultiplier: 1,
                lerp: 0.1,
            });

            lenis.on('scroll', handleScroll);

            const raf = (time) => {
                lenis.raf(time);
                animationFrameRef.current = requestAnimationFrame(raf);
            };
            animationFrameRef.current = requestAnimationFrame(raf);

            lenisRef.current = lenis;
            return lenis;
        } else {
            const scroller = scrollerRef.current;
            if (!scroller) return;

            const lenis = new Lenis({
                wrapper: scroller,
                content: scroller.querySelector('.scroll-stack-inner'),
                duration: 1.2,
                easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                smoothWheel: true,
                gestureOrientation: 'vertical',
                wheelMultiplier: 1,
                lerp: 0.1,
            });

            lenis.on('scroll', handleScroll);

            const raf = (time) => {
                lenis.raf(time);
                animationFrameRef.current = requestAnimationFrame(raf);
            };
            animationFrameRef.current = requestAnimationFrame(raf);

            lenisRef.current = lenis;
            return lenis;
        }
    }, [handleScroll, useWindowScroll]);

    useLayoutEffect(() => {
        const scroller = scrollerRef.current;
        if (!scroller) return;

        const cards = Array.from(
            useWindowScroll
                ? document.querySelectorAll('.scroll-stack-card')
                : scroller.querySelectorAll('.scroll-stack-card')
        );

        cardsRef.current = cards;

        cards.forEach((card, i) => {
            if (i < cards.length - 1) {
                card.style.marginBottom = `${itemDistance}px`;
            }
            card.style.willChange = 'transform, filter';
            card.style.transformOrigin = 'top center';
            card.style.backfaceVisibility = 'hidden';
        });

        setupLenis();

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (lenisRef.current) {
                lenisRef.current.destroy();
            }
            stackCompletedRef.current = false;
            cardsRef.current = [];
            isUpdatingRef.current = false;
        };
    }, [
        itemDistance,
        useWindowScroll,
        setupLenis
    ]);

    return (
        <div className={`scroll-stack-scroller ${className}`.trim()} ref={scrollerRef}>
            <div className="scroll-stack-inner">
                {children}
                <div className="scroll-stack-end" style={{ height: '50vh' }} />
            </div>
        </div>
    );
};

export default ScrollStack;
