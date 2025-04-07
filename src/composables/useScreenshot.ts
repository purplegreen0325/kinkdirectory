import html2canvas from 'html2canvas-pro'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useKinkListState } from './useKinkList'

export function useScreenshot() {
  const { t } = useI18n()
  const toast = useToast()
  const { activeList} = useKinkListState()
  const screenshotLoading = ref(false)
  const screenshotDataUrl = ref('')

  // Simple screenshot function that only captures the DOM element directly
  async function simpleScreenshot() {
    try {
      screenshotLoading.value = true
      
      // Find the element in the DOM
      const contentElement = document.getElementById('kink-list-content')
      if (!contentElement) {
        throw new Error('Could not find element with id "kink-list-content"')
      }
      
      if (!activeList.value) {
        throw new Error('No active list selected')
      }
      
      // Clone the content to make sure we don't miss any CSS
      const clone = contentElement.cloneNode(true) as HTMLElement
      clone.style.position = 'absolute'
      clone.style.left = '-9999px'
      clone.style.top = '0'
      clone.style.width = contentElement.offsetWidth + 'px'
      clone.style.height = 'auto'
      clone.style.backgroundColor = 'white'
       
      // Find all rating circles in the clone and replace Tailwind classes with direct styles
      const applyDirectStyles = () => {
        // Define direct color values matching Tailwind's color palette
        const ratingColors = {
          0: { bg: '#D1D5DB', border: '#9CA3AF' },          // Gray-300
          1: { bg: '#3B82F6', border: '#2563EB' },          // Blue-500
          2: { bg: '#10B981', border: '#059669' },          // Green-500
          3: { bg: '#FBBF24', border: '#D97706' },          // Yellow-500
          4: { bg: '#F97316', border: '#EA580C' },          // Orange-500
          5: { bg: '#EF4444', border: '#DC2626' }           // Red-500
        };

        // Add data-rating attributes to all rating buttons first
        // Add this to original document so we can capture it in the clone
        const originalKinkChoices = document.querySelectorAll('.w-4.h-4.rounded-full.border, .w-6.h-6.rounded.border');
        originalKinkChoices.forEach(choice => {
          if (choice instanceof HTMLElement) {
            let rating = 0;
            // Check all possible color class combinations for each rating level
            const classList = Array.from(choice.classList);
            
            // Check for active colors
            if ((classList.includes('bg-blue-500') || classList.includes('border-blue-500'))) {
              rating = 1;
            } else if ((classList.includes('bg-green-500') || classList.includes('border-green-500'))) {
              rating = 2;
            } else if ((classList.includes('bg-yellow-500') || classList.includes('border-yellow-500'))) {
              rating = 3;
            } else if ((classList.includes('bg-orange-500') || classList.includes('border-orange-500'))) {
              rating = 4;
            } else if ((classList.includes('bg-red-500') || classList.includes('border-red-500'))) {
              rating = 5;
            } else if ((classList.includes('bg-gray-300') || classList.includes('border-gray-400'))) {
              rating = 0;
            }
            
            choice.setAttribute('data-rating', String(rating));
          }
        });
        
        // Now process the clone with these data attributes
        // Find groups of rating circles and hide all except selected one
        const ratingContainers = clone.querySelectorAll('.hidden.lg\\:flex.space-x-1, .lg\\:flex.space-x-1');
        
        ratingContainers.forEach(container => {
          // Find all circles in this container
          const circles = container.querySelectorAll('button');
          
          // Find the selected circle
          let selectedRating = 0;
          
          circles.forEach(circle => {
            if (circle instanceof HTMLElement) {
              // Use the data attribute to get the rating
              const dataRating = circle.getAttribute('data-rating');
              if (dataRating && parseInt(dataRating) > 0) {
                selectedRating = parseInt(dataRating);
              }
              
              // Hide all circles initially
              circle.style.display = 'none';
            }
          });
          
          // Create a new element to show only the selected rating
          if (selectedRating >= 0) {
            const ratingElement = document.createElement('div');
            ratingElement.style.display = 'inline-block';
            ratingElement.style.width = '16px';
            ratingElement.style.height = '16px';
            ratingElement.style.borderRadius = '50%';
            ratingElement.style.backgroundColor = ratingColors[selectedRating as keyof typeof ratingColors].bg;
            ratingElement.style.borderColor = ratingColors[selectedRating as keyof typeof ratingColors].border;
            ratingElement.style.borderWidth = '1.5px';
            ratingElement.style.borderStyle = 'solid';
            ratingElement.style.margin = '4px 0';
            
            // Replace the container's content with just this rating
            container.innerHTML = '';
            container.appendChild(ratingElement);
          }
        });
        
        // Handle mobile view buttons (both in drawer and visible on screen)
        const mobileButtons = clone.querySelectorAll('.lg\\:hidden button, .flex.justify-center button');
        mobileButtons.forEach(button => {
          if (button instanceof HTMLElement) {
            // Get rating from data attribute
            const dataRating = button.getAttribute('data-rating');
            let mobileRating = dataRating ? parseInt(dataRating) : 0;
            
            // If no data-rating, try to detect from classes as fallback
            if (!dataRating) {
              if (button.classList.contains('border-blue-500') || button.classList.contains('bg-blue-500')) mobileRating = 1;
              else if (button.classList.contains('border-green-500') || button.classList.contains('bg-green-500')) mobileRating = 2;
              else if (button.classList.contains('border-yellow-500') || button.classList.contains('bg-yellow-500')) mobileRating = 3;
              else if (button.classList.contains('border-orange-500') || button.classList.contains('bg-orange-500')) mobileRating = 4;
              else if (button.classList.contains('border-red-500') || button.classList.contains('bg-red-500')) mobileRating = 5;
            }
            
            // Apply direct styles
            button.style.backgroundColor = ratingColors[mobileRating as keyof typeof ratingColors].bg;
            button.style.borderColor = ratingColors[mobileRating as keyof typeof ratingColors].border;
            button.style.width = '16px';
            button.style.height = '16px';
            button.style.borderRadius = '50%';
            button.style.display = 'inline-block';
            button.style.borderWidth = '1.5px';
            button.style.borderStyle = 'solid';
            button.style.margin = '4px 0';
            
            // No text content - empty circle
            button.textContent = '';
            
            // Remove classes that might interfere
            const classesToRemove: string[] = [];
            button.classList.forEach(cls => {
              if (cls.startsWith('bg-') || cls.startsWith('border-') || cls.startsWith('text-') || cls.startsWith('dark:')) {
                classesToRemove.push(cls);
              }
            });
            
            classesToRemove.forEach(cls => {
              button.classList.remove(cls);
            });
          }
        });
      }
      
      // Ensure all styles are computed and rendered
      document.body.appendChild(clone);
      
      // Apply direct styles to rating elements
      applyDirectStyles();
      
      // Use html2canvas-pro with optimized settings
      const canvas = await html2canvas(clone, {
        backgroundColor: 'white',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        removeContainer: true,
        imageTimeout: 0,
        ignoreElements: (element) => {
          // Ignore any irrelevant elements
          return element.classList?.contains('ignore-screenshot') || false
        },
        onclone: (document, element) => {
          // Force compute styles in the cloned document
          const allElements = element.querySelectorAll('*')
          allElements.forEach(el => {
            if (el instanceof HTMLElement) {
              window.getComputedStyle(el)
            }
          })
        }
      })
      
      // Clean up the clone
      document.body.removeChild(clone)
      
      // Save the data URL for use in the modal
      const dataUrl = canvas.toDataURL('image/png')
      screenshotDataUrl.value = dataUrl
      
      return dataUrl
      
    } catch (error) {
      console.error('Failed to take screenshot', error)
      toast.add({
        title: t('app.screenshot_error'),
        description: String(error),
        color: 'error',
        duration: 3000
      })
      throw error
    } finally {
      screenshotLoading.value = false
    }
  }

  // Function to download the screenshot
  function downloadScreenshot() {
    if (!screenshotDataUrl.value || !activeList.value) return
    
    const link = document.createElement('a')
    link.href = screenshotDataUrl.value
    link.download = `kinklist-${activeList.value.name.replace(/\s+/g, '-').toLowerCase() || 'export'}.png`
    link.click()
    
    toast.add({
      title: t('app.screenshot'),
      description: t('app.screenshot_downloaded'),
      color: 'success',
      duration: 3000
    })
  }

  return {
    screenshotLoading,
    takeScreenshot: simpleScreenshot,
    downloadScreenshot,
    screenshotDataUrl
  }
}