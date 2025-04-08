import html2canvas from 'html2canvas-pro'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useKinkListState } from './useKinkList'

export function useScreenshot() {
  const { t } = useI18n()
  const toast = useToast()
  const { activeList } = useKinkListState()
  const screenshotLoading = ref(false)
  const screenshotDataUrl = ref('')

  // Create a fixed-layout screenshot with 6 columns
  async function simpleScreenshot() {
    try {
      screenshotLoading.value = true

      if (!activeList.value) {
        throw new Error('No active list selected')
      }

      // Find the element in the DOM
      const contentElement = document.getElementById('kink-list-content')
      if (!contentElement) {
        throw new Error('Could not find element with id "kink-list-content"')
      }

      // Create a new fixed-width container for screenshot
      const container = document.createElement('div')
      container.style.position = 'absolute'
      container.style.left = '-9999px'
      container.style.top = '0'
      container.style.width = '2400px' // Increased width for 6 columns
      container.style.backgroundColor = 'white'
      container.style.padding = '20px'
      container.style.fontFamily = 'sans-serif'

      // Define the rating colors
      const ratingColors = {
        0: { bg: '#D1D5DB', border: '#9CA3AF' }, // Gray-300
        1: { bg: '#3B82F6', border: '#2563EB' }, // Blue-500
        2: { bg: '#10B981', border: '#059669' }, // Green-500
        3: { bg: '#FBBF24', border: '#D97706' }, // Yellow-500
        4: { bg: '#F97316', border: '#EA580C' }, // Orange-500
        5: { bg: '#EF4444', border: '#DC2626' }, // Red-500
      }

      // Create a 6-column grid layout
      const gridContainer = document.createElement('div')
      gridContainer.style.display = 'grid'
      gridContainer.style.gridTemplateColumns = 'repeat(6, 1fr)'
      gridContainer.style.gap = '12px'

      // Clone all categories from the original content
      const categories = contentElement.querySelectorAll('.category-container')

      categories.forEach((category) => {
        // Create a new category container
        const categoryContainer = document.createElement('div')
        categoryContainer.style.breakInside = 'avoid'
        categoryContainer.style.marginBottom = '12px'
        categoryContainer.style.border = '1px solid #E5E7EB'
        categoryContainer.style.borderRadius = '6px'
        categoryContainer.style.overflow = 'hidden'

        // Create the category header - make smaller (same size as section headers)
        const categoryHeader = document.createElement('div')
        categoryHeader.style.borderBottom = '1px solid #E5E7EB'
        categoryHeader.style.backgroundColor = '#F3F4F6'
        categoryHeader.style.padding = '5px 8px'
        categoryHeader.style.fontWeight = '600'
        categoryHeader.style.fontSize = '11px'

        // Get the category title
        const categoryTitle = category.querySelector('h2')
        categoryHeader.textContent = categoryTitle ? categoryTitle.textContent : ''

        categoryContainer.appendChild(categoryHeader)

        // Process each section container (general & role-specific)
        const sections = category.querySelectorAll('.border.border-gray-200')

        sections.forEach((section) => {
          // Create a table for the kinks
          const table = document.createElement('table')
          table.style.width = '100%'
          table.style.borderCollapse = 'collapse'

          // Create the header row
          const thead = document.createElement('thead')
          thead.style.backgroundColor = '#F3F4F6'
          thead.style.borderBottom = '1px solid #E5E7EB'

          const headerRow = document.createElement('tr')

          // Label column
          const labelHeader = document.createElement('th')
          labelHeader.style.textAlign = 'left'
          labelHeader.style.padding = '5px 8px'
          labelHeader.style.width = '70%'
          labelHeader.style.fontSize = '11px'
          headerRow.appendChild(labelHeader)

          // Check if this is a general section or role-specific section
          const isGeneral = !section.querySelector('th:nth-child(3)')

          if (isGeneral) {
            // General section has one column
            const generalHeader = document.createElement('th')
            generalHeader.style.textAlign = 'center'
            generalHeader.style.padding = '5px 8px'
            generalHeader.style.fontSize = '11px'
            generalHeader.style.fontWeight = '500'

            // Use the actual header text from the section instead of hardcoding "General"
            const originalHeader = section.querySelector('thead th:not(:first-child)')
            generalHeader.textContent = originalHeader ? originalHeader.textContent : t('app.general')

            headerRow.appendChild(generalHeader)
          }
          else {
            // Role-specific section has two columns
            // Get the column labels from the actual section headers
            const columnHeaders = section.querySelectorAll('thead th:not(:first-child)')
            columnHeaders.forEach((header) => {
              const newHeader = document.createElement('th')
              newHeader.style.textAlign = 'center'
              newHeader.style.padding = '5px 8px'
              newHeader.style.fontSize = '11px'
              newHeader.style.fontWeight = '500'
              newHeader.style.whiteSpace = 'nowrap'
              newHeader.textContent = header.textContent
              headerRow.appendChild(newHeader)
            })
          }

          thead.appendChild(headerRow)
          table.appendChild(thead)

          // Create the table body
          const tbody = document.createElement('tbody')

          // Process each kink row
          const kinkRows = section.querySelectorAll('tbody tr')
          kinkRows.forEach((row) => {
            const newRow = document.createElement('tr')
            newRow.style.borderBottom = '1px solid #E5E7EB'

            // Create label cell
            const labelCell = document.createElement('td')
            labelCell.style.padding = '6px 8px'
            labelCell.style.textAlign = 'left'
            labelCell.style.fontSize = '12px'

            // Get label text
            const label = row.querySelector('td')
            if (label) {
              labelCell.textContent = label.textContent?.trim() || ''
            }

            newRow.appendChild(labelCell)

            // Helper function to detect rating from element classes
            const detectRatingFromClasses = (element: Element): number => {
              if (element instanceof HTMLElement) {
                const classList = Array.from(element.classList)

                // Check for active colors in both background and border
                if (classList.includes('bg-blue-500') || classList.includes('border-blue-500')) {
                  return 1
                }
                else if (classList.includes('bg-green-500') || classList.includes('border-green-500')) {
                  return 2
                }
                else if (classList.includes('bg-yellow-500') || classList.includes('border-yellow-500')) {
                  return 3
                }
                else if (classList.includes('bg-orange-500') || classList.includes('border-orange-500')) {
                  return 4
                }
                else if (classList.includes('bg-red-500') || classList.includes('border-red-500')) {
                  return 5
                }
                // Default/not selected
                return 0
              }
              return 0
            }

            // Function to create a rating circle
            const createRatingCircle = (rating: number) => {
              const circle = document.createElement('div')
              circle.style.display = 'inline-block'
              circle.style.width = '14px'
              circle.style.height = '14px'
              circle.style.borderRadius = '50%'
              circle.style.backgroundColor = ratingColors[rating as keyof typeof ratingColors].bg
              circle.style.border = `1.5px solid ${ratingColors[rating as keyof typeof ratingColors].border}`
              return circle
            }

            // Process each rating column
            const ratingCells = row.querySelectorAll('td:not(:first-child)')

            ratingCells.forEach((cell) => {
              const newCell = document.createElement('td')
              newCell.style.padding = '6px 8px'
              newCell.style.textAlign = 'center'

              // Find selected rating
              let selectedRating = 0

              // Look for selected button
              const buttons = cell.querySelectorAll('button')
              buttons.forEach((button) => {
                if (button instanceof HTMLElement) {
                  // Check if this button is active/selected by looking for colored backgrounds
                  const isSelected = Array.from(button.classList).some(cls =>
                    (cls.includes('bg-') && !cls.includes('bg-gray') && !cls.includes('bg-transparent'))
                    || (cls.includes('border-') && !cls.includes('border-gray') && !cls.includes('border-transparent')),
                  )

                  if (isSelected) {
                    // First check data-rating if available
                    const dataRating = button.getAttribute('data-rating')
                    if (dataRating) {
                      selectedRating = Number.parseInt(dataRating)
                    }
                    else {
                      // Otherwise detect from classes
                      selectedRating = detectRatingFromClasses(button)
                    }
                  }
                }
              })

              // If no buttons are found, try to find rating elements directly
              if (selectedRating === 0 && cell.querySelector('div.rounded-full')) {
                const ratingElement = cell.querySelector('div.rounded-full')
                if (ratingElement) {
                  selectedRating = detectRatingFromClasses(ratingElement)
                }
              }

              // Create rating circle
              const circle = createRatingCircle(selectedRating)
              newCell.appendChild(circle)

              newRow.appendChild(newCell)
            })

            tbody.appendChild(newRow)
          })

          table.appendChild(tbody)
          categoryContainer.appendChild(table)
        })

        gridContainer.appendChild(categoryContainer)
      })

      container.appendChild(gridContainer)
      document.body.appendChild(container)

      // Use html2canvas-pro with optimized settings
      const canvas = await html2canvas(container, {
        backgroundColor: 'white',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        removeContainer: true,
        imageTimeout: 0,
      })

      // Clean up the container
      document.body.removeChild(container)

      // Save the data URL for use in the modal
      const dataUrl = canvas.toDataURL('image/png')
      screenshotDataUrl.value = dataUrl

      return dataUrl
    }
    catch (error) {
      console.error('Failed to take screenshot', error)
      toast.add({
        title: t('app.screenshot_error'),
        description: String(error),
        color: 'error',
        duration: 3000,
      })
      throw error
    }
    finally {
      screenshotLoading.value = false
    }
  }

  // Function to download the screenshot
  function downloadScreenshot() {
    if (!screenshotDataUrl.value || !activeList.value)
      return

    const link = document.createElement('a')
    link.href = screenshotDataUrl.value
    link.download = `kinklist-${activeList.value.name.replace(/\s+/g, '-').toLowerCase() || 'export'}.png`
    link.click()

    toast.add({
      title: t('app.screenshot'),
      description: t('app.screenshot_downloaded'),
      color: 'success',
      duration: 3000,
    })
  }

  return {
    screenshotLoading,
    takeScreenshot: simpleScreenshot,
    downloadScreenshot,
    screenshotDataUrl,
  }
}
