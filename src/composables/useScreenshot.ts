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

      // Add legend at the top
      const legendContainer = document.createElement('div')
      legendContainer.style.display = 'flex'
      legendContainer.style.alignItems = 'center'
      legendContainer.style.gap = '16px'
      legendContainer.style.marginBottom = '16px'
      legendContainer.style.padding = '8px 12px'
      legendContainer.style.borderRadius = '8px'
      legendContainer.style.backgroundColor = '#f9fafb'
      legendContainer.style.border = '1px solid #e5e7eb'

      // Legend title
      const legendTitle = document.createElement('div')
      legendTitle.style.display = 'flex'
      legendTitle.style.alignItems = 'center'
      legendTitle.style.gap = '4px'
      legendTitle.style.marginRight = '8px'
      legendTitle.style.fontSize = '13px'
      legendTitle.style.fontWeight = '500'
      legendTitle.style.color = '#111827'
      legendTitle.textContent = `${t('app.legend')}:`

      legendContainer.appendChild(legendTitle)

      // Legend items container
      const legendItems = document.createElement('div')
      legendItems.style.display = 'flex'
      legendItems.style.flexWrap = 'wrap'
      legendItems.style.alignItems = 'center'
      legendItems.style.gap = '12px'

      // Create legend item for "Not Entered" (0) first
      const notEnteredItem = createLegendItem(0, t('choices.not_entered'))
      legendItems.appendChild(notEnteredItem)

      // Create legend items for other ratings
      const ratingLabels = {
        1: t('choices.favorite'),
        2: t('choices.like'),
        3: t('choices.indifferent'),
        4: t('choices.maybe'),
        5: t('choices.limit'),
      }

      // Add the other ratings in order (1-5)
      for (let i = 1; i <= 5; i++) {
        const legendItem = createLegendItem(i, ratingLabels[i as keyof typeof ratingLabels])
        legendItems.appendChild(legendItem)
      }

      legendContainer.appendChild(legendItems)
      container.appendChild(legendContainer)

      // Helper function to create a legend item
      function createLegendItem(rating: number, label: string) {
        const item = document.createElement('div')
        item.style.display = 'flex'
        item.style.alignItems = 'center'
        item.style.gap = '4px'

        // Create the colored circle
        const circle = document.createElement('div')
        circle.style.width = '10px'
        circle.style.height = '10px'
        circle.style.borderRadius = '50%'
        circle.style.backgroundColor = ratingColors[rating as keyof typeof ratingColors].bg
        circle.style.border = `1px solid ${ratingColors[rating as keyof typeof ratingColors].border}`

        // Create the label
        const textLabel = document.createElement('span')
        textLabel.style.fontSize = '12px'
        textLabel.style.color = '#374151'
        textLabel.textContent = label

        item.appendChild(circle)
        item.appendChild(textLabel)

        return item
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
        categoryHeader.style.color = 'black'

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
          labelHeader.style.color = 'black'
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
            generalHeader.style.color = 'black'

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
              newHeader.style.color = 'black'
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
            labelCell.style.color = 'black'

            // Get label text
            const label = row.querySelector('td')
            if (label) {
              // Look for the element with data-kink-label attribute
              const kinkLabelElement = label.querySelector('[data-kink-label]')
              if (kinkLabelElement) {
                // Use only the text from the labeled element
                labelCell.textContent = kinkLabelElement.textContent?.trim() || ''
              }
              else {
                // Fallback to previous method if data-attribute not found
                const labelText = label.textContent?.trim() || ''
                const iconIndex = labelText.indexOf('?')
                if (iconIndex !== -1) {
                  labelCell.textContent = labelText.substring(0, iconIndex).trim()
                }
                else {
                  labelCell.textContent = labelText
                }
              }
            }

            newRow.appendChild(labelCell)

            // Helper function to detect rating from element classes
            const detectRatingFromClasses = (element: Element): number => {
              if (element instanceof HTMLElement) {
                const classList = Array.from(element.classList)

                // Explicitly check for gray classes (rating 0)
                if (classList.includes('bg-gray-300') || classList.includes('border-gray-400')) {
                  return 0
                }
                // Check for active colors in both background and border
                else if (classList.includes('bg-blue-500') || classList.includes('border-blue-500')) {
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
                  // First check data-rating attribute for any button
                  const dataRating = button.getAttribute('data-rating')
                  if (dataRating) {
                    const rating = Number.parseInt(dataRating)
                    // If this is the active button, use its rating
                    const isSelected = Array.from(button.classList).some(cls =>
                      (cls.includes('bg-') && !cls.includes('bg-transparent'))
                      || (cls.includes('border-') && !cls.includes('border-transparent')),
                    )

                    if (isSelected) {
                      selectedRating = rating
                      // Break the loop if we found the selected button
                    }
                  }
                  else {
                    // Check if this button is active/selected by looking for colored backgrounds
                    const isSelected = Array.from(button.classList).some(cls =>
                      (cls.includes('bg-') && !cls.includes('bg-gray') && !cls.includes('bg-transparent'))
                      || (cls.includes('border-') && !cls.includes('border-gray') && !cls.includes('border-transparent')),
                    )

                    if (isSelected) {
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
